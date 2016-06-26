var winCircus = 0;
var centerX = window.innerWidth / 2;
var centerY = window.innerHeight / 2;
var enemies = {};
var enemiesID = 0;
var enemyContainer = null;
var enemyInterval = null;
var enemySpeed = 0;
var maxSpeed = 3000;
var scoreText = null;
var sheepAnim = null;
var pitchContainer = null;

var animateContainer = null;
var attackCircle = null;

var patterns = [
	[0, 1, 2, 3, 4, 5],
	[0, 1, 0],
	[1, 0, 1],
	[5, 4, 3, 2, 1, 0]
];
var score = 0;

function EnemyType() {
	var angle = Math.random() * 360;
	var n = Math.floor(Math.random() * patterns.length);
	this.type = n;
	this.img = new createjs.Bitmap("img/fox_burned"+n+".png");
	this.img.x = centerX-76+winCircus*Math.cos(angle);
	this.img.y = centerY-66+winCircus*Math.sin(angle);
}

function init() {
	stage = new createjs.Stage('canvas');
	canvas = document.getElementById('canvas');
	enemyContainer = new createjs.Container();
	stage.addChild(enemyContainer);
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	winCircus = Math.sqrt(window.innerHeight*window.innerHeight + window.innerWidth*window.innerWidth)/2;
	
	var spriteSheet = new createjs.SpriteSheet({
		images: [
			"img/sheep_burned64.png",
			"img/sheep_nervous.png",
			"img/sheep_nervous2.png",
			"img/sheep_shock1.png",
			"img/sheep_shock2.png"
		],
		frames: {width: 152, height: 135},
		framerate: 0.3,
		animations: {
			run: [0, 4]
		}
	});
	sheepAnim = new createjs.Sprite(spriteSheet, "run");
	sheepAnim.x = centerX - 76;
	sheepAnim.y = centerY - 67.5;
	
	scoreText = new createjs.Text("", "50px Arial", "#1E90FF");
	scoreText.x = 30;
	scoreText.y = window.innerHeight-100;
	stage.addChild(scoreText);

    animateContainer = new createjs.Container();
    animateContainer.x = centerX-5;
    animateContainer.y = centerY;
    stage.addChild(animateContainer);

	pitchContainer = new createjs.Container();
	pitchContainer.x = centerX - 200;
	pitchContainer.y = window.innerHeight - 120;
	stage.addChild(pitchContainer);

	$('#dieDiv').css('z-index', -1);
	$('#startDiv').css('z-index', 1);

	createjs.Ticker.addEventListener('tick', tick);
	createjs.Ticker.timingMode = createjs.Ticker.RAF;

	realTimePitchTracking(patterns, killEnemy, drawPitch);
}

function play() {
	enemies = {};
	enemiesID = 0;
	enemyContainer.removeAllChildren();
	animateContainer.removeAllChildren();
	stage.addChild(sheepAnim);
	scoreText.text = "Score: 0";
	enemyInterval = setInterval(enemySpawn, 1000);
	$('#dieDiv').css('z-index', -1);
	$('#startDiv').css('z-index', -2);
	enemySpeed = 0;
	score = 0;
}

function enemySpawn() {
	/*angle = Math.random() * 360;
	enemy = new createjs.Bitmap("/img/fox_burned.png");
	enemy.x = centerX-76+winCircus*Math.cos(angle);
	enemy.y = centerY-66+winCircus*Math.sin(angle);
	*/
	enemy = new EnemyType();
	enemiesID++;
	enemies[enemiesID] = enemy;
	enemyContainer.addChild(enemy.img);
	enemySpeed = Math.min(maxSpeed,enemySpeed+300);
	createjs.Tween.get(enemy.img)
		.to({x: centerX-76, y: centerY-66}, 10000-enemySpeed)
		.call(die);
}

function killEnemy(ptnNum) {
	for (id in enemies) {
		if (enemies[id].type == ptnNum) {  // if match pattern
			var tmp = enemies[id].img;
			createjs.Tween.get(tmp, {override: true})
				.to({alpha: 0, scaleX: 1.5, scaleY: 1.5}, 200)
				.call(function () {
					enemyContainer.removeChild(tmp);
				});
			delete enemies[id];
			score++;
		}
	}
	attackAnimate(ptnNum);
	scoreText.text = 'Score: ' + score;
}

function drawPitch(pitchBuf) {
	pitchContainer.removeAllChildren();
	var bg = new createjs.Shape();
	bg.graphics.f('black').rr(-10, -10, 420, 120, 6);
	bg.alpha = 0.5;
	pitchContainer.addChild(bg);
	for (var i = 0; i < pitchBuf.length; i++) {
		if (isFinite(pitchBuf[i])) {
			var point = new createjs.Shape();
			point.graphics.f('cyan').dc(2 * i, 200 - 3 * pitchBuf[i], 2);
			pitchContainer.addChild(point);
		}
	}
}

function die() {
	stage.removeChild(sheepAnim);
	createjs.Tween.removeAllTweens();
	clearInterval(enemyInterval);
	$('#dieDiv').css('z-index', 1);
}

function tick(event) {
	stage.update({delta: event.delta});
}

function attackAnimate(n){
    var colorType = ["red","blue","green","yellow"];
    attackCircle = new createjs.Shape();
    attackCircle.graphics.ss(2.5).s(colorType[n]).drawCircle(0, 0, 90);
    animateContainer.addChild(attackCircle);

    createjs.Tween.get(attackCircle)
        .to({scaleX: 6.2, scaleY: 6.2, alpha: 0}, 400)
        .call(function(){
            animateContainer.removeChild(attackCircle);
		});
}
