var winCircus = 0;
var centerX = window.innerWidth / 2;
var centerY = window.innerHeight / 2;
var enemies = {};
var enemiesID = 0;
var enemyContainer = null;
var enemyInterval = null;
var enemySpeed = 0;
var maxSpeed = 3000;
var speedText = null;
var sheepAnim = null;
var pitchContainer = null;

var animateContainer = null;
var attackCircle = null;

var patterns = [
	[0, 1, 0],
	[1, 0, 1]
];

function EnemyType() {
	var angle = Math.random() * 360;
	var n = Math.floor(Math.random() * 3);
	this.type = n;
	this.img = new createjs.Bitmap("/img/fox_burned"+n+".png");
	this.img.x = centerX-76+winCircus*Math.cos(angle);
	this.img.y = centerY-66+winCircus*Math.sin(angle);
}

function init() {
	stage = new createjs.Stage('canvas');
	canvas = document.getElementById('canvas');
	container = new createjs.Container();
	enemyContainer = new createjs.Container();
	container.addChild(enemyContainer);
	stage.addChild(container);
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	winCircus = Math.sqrt(window.innerHeight*window.innerHeight + window.innerWidth*window.innerWidth)/2;
	
	var data = {
		images: [
			"/img/sheep_burned64.png",
			"/img/sheep_nervous.png",
			"/img/sheep_nervous2.png",
			"/img/sheep_shock1.png",
			"/img/sheep_shock2.png"
		],
		frames: {width: 152, height: 135},
		framerate: 0.3,
		animations: {
			run: [0, 4]
		}
	};
	var spriteSheet = new createjs.SpriteSheet(data);
	sheepAnim = new createjs.Sprite(spriteSheet, "run");
	sheepAnim.x = centerX - 76;
	sheepAnim.y = centerY - 67.5;
	
	speedText = new createjs.Text("Speed: 0", "50px Arial", "#1E90FF");
	speedText.x = 0;
	speedText.y = window.innerHeight-100;
	stage.addChild(speedText);

	pitchContainer = new createjs.Container();
	stage.addChild(pitchContainer);

	$('#dieDiv').css('z-index', -1);
	$('#startDiv').css('z-index', 1);
}

function play() {
	attackAnimate(0);
	stage.addChild(sheepAnim);
	createjs.Ticker.addEventListener('tick', tick);
	createjs.Ticker.timingMode = createjs.Ticker.RAF;
	enemyInterval = setInterval(enemySpawn, 1000);
	$('#dieDiv').css('z-index', -1);
	$('#startDiv').css('z-index', -2);
	enemySpeed = 0;
	realTimePitchTracking(patterns, killEnemy, drawPitch);
}

function enemySpawn() {
	/*angle = Math.random() * 360;
	enemy = new createjs.Bitmap("/img/fox_burned.png");
	enemy.x = centerX-76+winCircus*Math.cos(angle);
	enemy.y = centerY-66+winCircus*Math.sin(angle);
	*/
	enemy = new EnemyType();
	enemiesID++;
	enemies[enemiesID] = enemy.img;
	enemyContainer.addChild(enemy.img);
	enemySpeed = Math.min(maxSpeed,enemySpeed+300);
	speedText.text = "Speed: "+enemySpeed;
	createjs.Tween.get(enemy.img)
		.to({x: centerX-76, y: centerY-66}, 10000-enemySpeed)
		.call(die);
}

function killEnemy(ptnNum) {
	for (id in enemies) {
		if (true) {  // if match pattern
			enemyContainer.removeChild(enemies[id]);
			createjs.Tween.removeTweens(enemies[id]);
			delete enemies[id];
		}
	}
}

function drawPitch(pitchBuf) {
	pitchContainer.removeAllChildren();
	for (var i = 0; i < pitchBuf.length; i++) {
		if (isFinite(pitchBuf[i])) {
			var point = new createjs.Shape();
			point.graphics.f('red').dc(2 * i, 100 - pitchBuf[i], 2);
			pitchContainer.addChild(point);
		}
	}
}

function die() {
	stage.removeChild(sheepAnim);
	createjs.Tween.removeAllTweens();
	clearInterval(enemyInterval);
	speedText.text = "Speed: 0";
	$('#dieDiv').css('z-index', 1);
}

function restartClick() {
	enemies = {};
	enemiesID = 0;
	enemyContainer.removeAllChildren();
	play();
}

function tick(event) {
	stage.update({delta: event.delta});
}

function attackAnimate(n){
    var colorType = ["red","blue","green"];
    animateContainer = new createjs.Container();
    animateContainer.x = centerX-5;
    animateContainer.y = centerY;
    container.addChild(animateContainer);

    attackCircle = new createjs.Shape();
    attackCircle.graphics.ss(2.5).s(colorType[n]).drawCircle(0, 0, 90);
    animateContainer.addChild(attackCircle);
    // attackCircle2 = new createjs.Shape();
    // attackCircle2.graphics.ss(2.5).s(colorType[n]).drawCircle(0, 0, 100);
    // animateContainer.addChild(attackCircle2);
    createjs.Tween.get(animateContainer)
        .to({scaleX: 6.2,scaleY: 6.2,alpha: 0.1}, 400)
        .call(function(){
            container.removeChild(animateContainer);}
        );
}
