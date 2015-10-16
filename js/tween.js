function Tween(){
    
    for(var i = 0; i < arguments.length; ++i){
        
        var options = arguments[i];
        
        if(options.from === options.to) continue;
        
        options.delay = options.delay || 0;
        options.easing = options.easing || 'cubicInOut';
        
        var now = Date.now();
        
        var tween = {
	        id: options.id || _.uniqueId(),
            from: options.from,
            to: options.to,
            startTime: now + options.delay,
            endTime: now + options.delay + options.duration,
            duration: Math.max(options.duration, 1),
            easing: options.easing,
            handler: options.step,
            complete: options.complete || function(){}
        }
        
        Tween.tweens.push(tween);

    }
    
    
}

Tween.tick = function(now){

    var now = now || Date.now();
    
    var tween, elapsed, progress,
        i = Tween.tweens.length;
    
    while(i--){
        
        tween = Tween.tweens[i];
        
        if(tween.endTime < now){
            tween.handler(tween.to);
            tween.complete();
            Tween.tweens.splice(i, 1);
            continue;
        }
        
        if(tween.startTime > now) continue;
        
        elapsed = now - tween.startTime;
        
        progress = elapsed / tween.duration;
        
        progress = Tween.easings[tween.easing](progress);
        
        tween.handler(tween.from + ((tween.to - tween.from) * progress));
        
    }
    
}

Tween.clear = function(id){
	
	if(!id){
		
		Tween.tweens = [];
		
	} else {
		
		var i = Tween.tweens.length, tween;
		
		while(i--){
			
			tween = Tween.tweens[i];
			
			if(tween.id === id) Tween.tweens.splice(i, 1);
			
		}
		
	}
	
	
};

Tween.tweens = [];

Tween.easings = {
    linear: function(x){
        return x;
    },
    easeIn: function(x){
        return Math.pow(x, 2);
    },
    easeOut: function(x){
        return 1 - Math.pow(x-1, 2);
    },
    cubicIn: function(x){
        return Math.pow(x, 3);
    },
    cubicOut: function(x){
        return 1-Math.pow(1-x,3);
    },
    cubicInOut: function(x){
        if(x < 0.5) return Tween.easings.cubicIn(x*2)/2;
        return 1-Tween.easings.cubicIn((1-x)*2)/2; 
    },
    quadIn: function(x){
        return Math.pow(x, 4);
    },
    quadOut: function(x){
        return 1-Math.pow(1-x,4);
    },
    quadInOut: function(x){
        if(x < 0.5) return Tween.easings.quadIn(x*2)/2;
        return 1-Tween.easings.quadIn((1-x)*2)/2; 
    },
    easeInOut: function(x){
        if (x > .5) return Tween.easings.easeIn(x);
        return Tween.easings.easeOut(x);
    },
    bounce: function(x) {
        if (x < (1 / 2.75)) {
            return 7.6 * x * x;
        } else if (x < (2 /2.75)) {
            return 7.6 * (x -= (1.5 / 2.75)) * x + 0.74;
        } else if (x < (2.5 / 2.75)) {
            return 7.6 * (x -= (2.25 / 2.75)) * x + 0.91;
        } else {
            return 7.6 * (x -= (2.625 / 2.75)) * x + 0.98;
        }
    }
}