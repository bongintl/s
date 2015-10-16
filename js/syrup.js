var syrup = (function(){
    
    function clamp(x, min, max){
    	return Math.max( min, Math.min( x, max ) );
    }
    
    function normalize(x, min, max){
    	return (x-min) / (max-min);
    }
    
    function scale(x, oldMin, oldMax, newMin, newMax){
        if(oldMin === 0 && oldMax === 1){
            return newMin + x * (newMax - newMin);
        } else {
            return newMin + normalize(x, oldMin, oldMax) * (newMax - newMin);
        }
    }
    
    var pink = new THREE.Color( 1, 0.478, 0.952 );
    var cyan = new THREE.Color( 0.019, 0.89, 0.9 );
    var blue = new THREE.Color( 0.317, 0.02, 0.9 );
    var purple = new THREE.Color( 0.59, 0.11, 0.99 );
    var peach = new THREE.Color( 0.98, 0.87, 0.89 );
    
    var CAMERA_DISTANCE = 600;
    var SEGMENT_SIZE = 200;
    var PLANE_WIDTH = 20000;
    var PLANE_DEPTH = 10000;
    var Z_SPLIT = 2000;
    var MAX_DRIFT_RATE = 0.00015;
    var driftRate = 0;
    var drift = 0;
    
    var SPEED = 1500;
    var WAVE_HEIGHT = 100;
    var HALF_WAVE_HEIGHT = WAVE_HEIGHT/2;
    var WAVE_FREQUENCY_X = 300;
    var WAVE_FREQUENCY_Y = 2000;
    
    var vertexIndices = 'abc'.split('');
    
    noise.seed( Math.random() );
    
    function Sea(w, d, z){
    	
    	function initVertexColors(geometry){
    		
    		for(var i = 0; i < geometry.faces.length; ++i){
    		    
    		    for(var j = 0; j < 3; ++j){
    		        
    		        geometry.faces[i].vertexColors[ j ] = new THREE.Color(0x0000ff);
    		        
    		    }
    		    
    		}
    		
    	}
    	
    	function colorPlane(plane, min, max, fog){
    		
    		var vertexIndex, vertex, face, color, height, depth, i, j;
    		
    		var colors = [];
    
    	    for(i = 0; i < plane.geometry.faces.length; ++i){
    	        
    	        face = plane.geometry.faces[i];
    	        
    	        for(j = 0; j < 3; ++j){
    	            
    	            vertexIndex = face[ vertexIndices[j] ];
    	            color = face.vertexColors[j];
    	            
    	            if( colors[ vertexIndex ] ){
    	                
    	                color.copy( colors[ vertexIndex ] );
    	                
    	            } else {
    	                
    	                vertex = plane.geometry.vertices[ vertexIndex ].clone();
    	                
        	            plane.localToWorld( vertex );
        	            
        	            height = normalize(vertex.y, -HALF_WAVE_HEIGHT, HALF_WAVE_HEIGHT);
        	            
        	            color.r = scale(height, 0, 1, min.r, max.r);
        	            color.g = scale(height, 0, 1, min.g, max.g);
        	            color.b = scale(height, 0, 1, min.b, max.b);
        	            
        	            depth = normalize(vertex.z, -CAMERA_DISTANCE, -PLANE_DEPTH);
        	            
        	            color.r = scale(depth, 0, 1, color.r, fog.r);
        	            color.g = scale(depth, 0, 1, color.g, fog.g);
        	            color.b = scale(depth, 0, 1, color.b, fog.b);
        	            
        	            colors[ vertexIndex ] = color;
    	                
    	            }
    
    	        }
    	        
    	    }
    	    
    		plane.geometry.colorsNeedUpdate = true;
    	    
    	}
    
    	var topGeometry = new THREE.PlaneGeometry( w, d, w/SEGMENT_SIZE, d/SEGMENT_SIZE );
    	
    	var topMaterial, bottomMaterial;
    	
    	if(Modernizr.webgl){
    		
    		topMaterial = new THREE.MeshBasicMaterial({
    			side: THREE.FrontSide,
    			vertexColors: THREE.VertexColors
            });
    		
    		bottomMaterial = new THREE.MeshBasicMaterial({
    			side: THREE.BackSide,
    			vertexColors: THREE.VertexColors
    		});
    		
    	} else {
    		
    		topMaterial = new THREE.MeshBasicMaterial({
    			side: THREE.FrontSide,
    			color: pink,
    			overdraw: 0.5
    		});
    		
    		bottomMaterial = new THREE.MeshBasicMaterial({
    			side: THREE.BackSide,
    			color: blue,
    			overdraw: 0.5
    		});
    		
    	}
    	
    	var top = new THREE.Mesh( topGeometry, topMaterial );
    	top.rotation.x = -Math.PI/2;
    	top.position.z = z - d/2;
    	
    	var bottom = new THREE.Mesh( topGeometry.clone(), bottomMaterial );
    	bottom.rotation.x = -Math.PI/2;
    	bottom.position.z = z - d/2;
    	
    	initVertexColors(top.geometry);
    	initVertexColors(bottom.geometry);
    	
    	this.object = new THREE.Object3D();
    	this.object.add( top, bottom )
    	
    	this.tick = function(now, drift){
    		
    		var v, z;
    		
    	    for(var i = 0; i < top.geometry.vertices.length; ++i){
    	    	
    	        v = top.geometry.vertices[i].clone();
    	        
    	        top.localToWorld( v );
    	        
    	        z = noise.simplex3(v.x / 2000 + drift, v.z / 2000, now * 0.0001) * WAVE_HEIGHT;
    	        
    	        if(v.z === -10400) z = 0;
    	        
    	        top.geometry.vertices[i].z = z;
    	        bottom.geometry.vertices[i].z = z;
    	    }
    	    
    	    top.geometry.verticesNeedUpdate = true;
    		bottom.geometry.verticesNeedUpdate = true;
    		
    		colorPlane( top, pink, purple, peach );
    		colorPlane( bottom, peach, cyan, blue );
    		
    	}
    	
    }
    
    var camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 100000 );
    
    var backScene = new THREE.Scene();
    
    if(Modernizr.webgl){
    	
    	var backRenderer = new THREE.WebGLRenderer({
    	    antialias: true,
    		canvas: document.getElementById( 'canvasBack' ),
    	});
    	
    } else {
    	
    	var backRenderer = new THREE.CanvasRenderer({
    	    antialias: true,
    		canvas: document.getElementById( 'canvasBack' )
    	});
    	
    }
    
    backRenderer.setSize( window.innerWidth, window.innerHeight );
    backRenderer.setClearColor(peach);
    
    var backSeaDepth;
    
    if(Modernizr.csspointerevents){
    	backSeaDepth = ( CAMERA_DISTANCE + PLANE_DEPTH ) - Z_SPLIT;
    } else {
    	backSeaDepth = PLANE_DEPTH;
    }
    
    var backSea = new Sea( PLANE_WIDTH, backSeaDepth, Modernizr.csspointerevents ? -Z_SPLIT + SEGMENT_SIZE : -CAMERA_DISTANCE );
    
    backScene.add( backSea.object );
    
    var bgGeometry = new THREE.PlaneGeometry(PLANE_WIDTH, PLANE_DEPTH, 1, 1);
    var bgMaterial = new THREE.MeshBasicMaterial({color: 0x5104e8});
    var bg = new THREE.Mesh(bgGeometry, bgMaterial);
    
    bg.position.z -= 10400;
    bg.position.y -= PLANE_DEPTH * 0.5;
    
    backScene.add( bg );
    
    if(Modernizr.csspointerevents){
    	
    	var frontScene = new THREE.Scene();
    	
    	if(Modernizr.webgl){
    		
    		var frontRenderer = new THREE.WebGLRenderer({
    		    antialias: true,
    		    alpha: true,
    			canvas: document.getElementById( 'canvasFront' )
    		});
    		
    	} else {
    		
    		var frontRenderer = new THREE.CanvasRenderer({
    		    antialias: true,
    		    alpha: true,
    			canvas: document.getElementById( 'canvasFront' )
    		});
    		
    	}
    	
    	
    	frontRenderer.setSize( window.innerWidth, window.innerHeight );
    	
    	var frontSea = new Sea( PLANE_WIDTH, Z_SPLIT - CAMERA_DISTANCE, -CAMERA_DISTANCE );
    	
    	frontScene.add( frontSea.object )
    	
    }
    
    var then = Date.now();
    
    function render(){
        
        var now = Date.now();
        var d = now - then;
        drift += driftRate * d;
        
        backSea.tick(now, drift);
        if( Modernizr.csspointerevents ) frontSea.tick(now, drift)
    	
    	backRenderer.render( backScene, camera );
    	if( Modernizr.csspointerevents ) frontRenderer.render( frontScene, camera )
    	
    	Tween.tick();
    	
    	then = now;
    	
    	requestAnimationFrame(render);
    	
    }
    
    render();
    
    var TRANSITION_SPEED = 2000;
    
    function setState(state, instant){
    	
    	Tween.clear('camera');
    	
    	var duration = instant ? 0 : TRANSITION_SPEED;
    	
    	Tween({
    		id: 'camera',
    		from: camera.position.x,
    		to: state.x || 0,
    		duration: duration,
    		step: function(x){
    			camera.position.x = x;
    		}
    	},{
    		id: 'camera',
    		from: camera.position.y,
    		to: state.y || 0,
    		duration: duration,
    		step: function(y){
    			camera.position.y = y;
    		}
    	},{
    		id: 'camera',
    		from: camera.position.z,
    		to: state.z || 0,
    		duration: duration,
    		step: function(z){
    			camera.position.z = z;
    		}
    	},{
    		id: 'camera',
    		from: camera.rotation.x,
    		to: state.rx || 0,
    		duration: duration,
    		step: function(r){
    			camera.rotation.x = r;
    		}
    	},{
    		id: 'camera',
    		from: camera.rotation.y,
    		to: state.ry || 0,
    		duration: duration,
    		step: function(r){
    			camera.rotation.y = r;
    		}
    	},{
    		id: 'camera',
    		from: camera.rotation.z,
    		to: state.rz || 0,
    		duration: duration,
    		step: function(r){
    			camera.rotation.z = r;
    		}
    	},{
    		id: 'camera',
    		from: WAVE_HEIGHT,
    		to: state.wh || 100,
    		duration: duration,
    		step: function(w){
    			WAVE_HEIGHT = w;
    		}
    	},{
    		id: 'camera',
    		from: driftRate,
    		to: state.dr || 0,
    		duration: duration,
    		step: function(d){
    			driftRate = d;
    		}
    	});
    	
    }
    
    var states = {
    	front: {
    	},
    	up: {
    		y: 600,
    		dr: MAX_DRIFT_RATE
    	},
    	down: {
    		y: -600
    	},
    	side: {
    		rz: -Math.PI/2,
    		wh: 75
    	},
    	top: {
    		y: 6000,
    		z: -4000,
    		rx: -Math.PI/2
    	},
    	bottom: {
    		y: -6000,
    		z: -4000,
    		rx: Math.PI/2
    	}
    }
    
    var allStates = _.reduce(states, function( memo, value, key ){ return memo + ' ' + key }, '');
    
    $(window).on('resize', function(){
    	camera.aspect = window.innerWidth / window.innerHeight;
    	camera.updateProjectionMatrix();
    	backRenderer.setSize( window.innerWidth, window.innerHeight );
    	if( Modernizr.csspointerevents ) frontRenderer.setSize( window.innerWidth, window.innerHeight );
    })
    
    var ret = {};
    
    _.each(states, function(value, key){
    	
    	ret[key] = function(){
    	    setState(value);
    	    $( 'body' ).removeClass( allStates ).addClass( key );
    	}
    	
    });
    
    return ret;
    
})();

_.each(syrup, function(func, name){
    
    $('.js-' + name).click(func)
    
})