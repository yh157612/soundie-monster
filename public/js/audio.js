(function () {
	
window.AudioContext = window.AudioContext || window.webkitAudioContext;
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

var SPF = 1024;  // sample per frame
var PBS = 200;  // pitch buffer size
var audioCtx = null;
var micSource = null;
var analyser = null;
var buffer = new Float32Array(SPF);
var pitchBuffer = new Array(PBS);

var patterns = null;
var matchCallback = null;
var pitchCallback = null;

// Some parameters:
// Melody matching tolerance, higher => easier
var TOLERANCE = 0.1;
// Volume threshold, higher => need louder
var VOLTHRESH = 0.03;
// Minimal humming time (in #element in pitchBuffer), higher => need longer humming
var MINHUMTIME = 10;
var ZCRTHRESH = 0.03;

function realTimePitchTracking(p, matchCb, pitchCb) {
	audioCtx = new AudioContext();
	navigator.getUserMedia({audio: true}, function (stream) {
		micSource = audioCtx.createMediaStreamSource(stream);
		analyser = audioCtx.createAnalyser();
		analyser.fftSize = SPF;
		micSource.connect(analyser);
		patterns = p;
		matchCallback = matchCb;
		pitchCallback = pitchCb;
		setupPattern();
		setInterval(processing, 20);
	}, function () {
		alert('getUserMedia error');
	});
}

function setupPattern() {
	// Normalizing all the patterns
	for (var i = 0; i < patterns.length; i++) {
		var sum = 0;
		for (var j = 0; j < patterns[i].length; j++) {
			sum += patterns[i][j];
		}
		var mean = sum / patterns[i].length;
		var stddev = 0;
		for (var j = 0; j < patterns[i].length; j++) {
			patterns[i][j] -= mean;
			stddev += patterns[i][j] * patterns[i][j];
		}
		stddev = Math.sqrt(stddev / patterns[i].length);
		for (var j = 0; j < patterns[i].length; j++) {
			patterns[i][j] /= stddev;
		}
	}
}

function processing() {
	// Save the current wave form to buffer
	analyser.getFloatTimeDomainData(buffer);
	var freq = calcFrequency(buffer);
	// Convert frequency to semitone. Note: low volume => -Infinity
	var semitone = 69 + 12 * Math.LOG2E * Math.log(freq / 440);
	pitchBuffer.shift();
	pitchBuffer.push(semitone);
	pitchCallback(pitchBuffer);

	if (isFinite(semitone)) {
		var anyMatch = false;
		for (var i = 0; i < patterns.length; i++) {
			// Lower E => Better fit!
			var E = testMatch(patterns[i]);
			if (E < TOLERANCE) {  // This is melody matching tolerance
				matchCallback(i);
				anyMatch = true;
			}
			// console.log('[P' + i + '] ' + E);
		}
		if (anyMatch) {
			for (var i = 0; i < pitchBuffer.length; i++)
				pitchBuffer[i] = -Infinity;
		}
	}
}

function calcFrequency(buf) {
	var volume = 0;
	for (var i = 0; i < SPF; i++) {
		volume += Math.abs(buf[i]);
	}
	if (volume / SPF < VOLTHRESH)  // This is volume threshold
		return 0;
	var zcr = 0;
	for (var i = 1; i < SPF; i++) {
		if (buf[i] * buf[i - 1] <= 0)
			zcr++;
	}
	if (zcr / SPF > ZCRTHRESH)
		return 0;
	return autoCorrelation(buf);
}

function autoCorrelation(buf) {
	var minOffset = 0;
	var bestOffset = -1;
	var best = -Infinity;
	var acf = [];
	for (var i = minOffset; i < SPF; i++) {
		var v = 0;
		for (var j = 0; j + i < SPF; j++) {
			v += buf[j] * buf[j + i];
		}
		acf.push(v);
	}
	var sum = 0;
	for (var i = 0; i < acf.length; i++) {
		sum += acf[i];
	}
	var mean = sum / acf.length;
	var flag = false;
	for (var i = 0; i < acf.length; i++) {
		if (acf[i] < mean)
			flag = true;
		if (flag) {
			if (acf[i] > best) {
				best = acf[i];
				bestOffset = i;
			}
		}
	}

	var freq = audioCtx.sampleRate / bestOffset;
	return (freq > 1000) ? 0 : freq;
}

function testMatch(ptn) {
	var best = Infinity;
	var sum = 0;
	var count = 0;
	for (var i = 1; i <= PBS; i++) {
		if (isFinite(pitchBuffer[PBS - i])) {
			sum += pitchBuffer[PBS - i];
			count++;
		}
		if (i <= MINHUMTIME)  // This limits the minimal humming time
			continue;

		// Normalizing the pitch buffer
		var mean = sum / count;
		var stddev = 0;
		var buf = pitchBuffer.slice(PBS - i);
		for (var j = 0; j < buf.length; j++) {
			if (isFinite(buf[j])) {
				buf[j] -= mean;
				stddev += buf[j] * buf[j];
			}
		}
		stddev = Math.max(Math.sqrt(stddev / count), 1);
		for (var j = 0; j < buf.length; j++) {
			buf[j] /= stddev;
		}

		// Check how much humming is close to pattern
		var diff = 0;
		var checkpoint = new Array(ptn.length);
		for (var j = 0; j < buf.length; j++) {
			if (isFinite(buf[j])) {
				var k = (ptn.length * j / buf.length) | 0;
				if (Math.abs(buf[j] - ptn[k]) < 0.1) {
					checkpoint[k] = true;
				}
				diff += Math.pow(buf[j] - ptn[k], 2);
			}
		}
		for (var k = 0; k < checkpoint.length; k++) {
			if (!checkpoint[k]) {
				diff = Infinity;
				break;
			}
		}
		diff /= count;
		if (diff < best) {
			best = diff;
		}
	}
	return best;
}

window.realTimePitchTracking = realTimePitchTracking;

})();