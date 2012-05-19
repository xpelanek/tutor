/* 
 * Martin Korbel, 2010
 * pro Tutora zhackoval Radek Pelanek, 2011
 */


var turtle;
var automat;
var speedDebug = 350;
var timerLogo;
var counter = 0;
var arrowCanvas = null;
var patternCanvas = null;
var patternAutomat = null;
var paused =  false;
var redLine = null;
var moveCount = 1;
var solved = 0;

// metoda na posun krokovaciho radku
function goLine(row) {    
  if(redLine == null) {
    redLine = 
   $("<div class=\"redLine\" style=\"position: absolute; top: 6px; left: 0; width: 100%; height: 12pt; background-color: #AA2222; opacity: 0.4; z-index: 0;\"></div>");
    //alert(editor.frame.contentDocument.body);
    redLine.prependTo(editor.frame.contentDocument.body);   
  }
  redLine.css('top', 4 + ((row-1) * 15));
}

function check_equivalence() {
    for (var l in patternTurtle.lineshash) {
    	if (turtle.lineshash[l] == undefined) {
		return 0;
    	}
    }
    for (var l in turtle.lineshash) {
    	if (patternTurtle.lineshash[l] == undefined) {
		return 0;
    	}
    }
    return 1;
}

// spusteni interpretace kodu
function run() {
    setStatus(translate('drawing'));
    $('#source').val(editor.getCode());
    $('#canvasArrow').remove();
    $('#message').html("");
//    turtle = new Turtle($('#canvas'));
    turtle = new Turtle(canvas);
    turtle.clean();
    automat = new ParserSource(turtle, $('#source').val());
    
    try {
    	if (solved == 1) {
	        $('#message').html("Uloha jiz byla vyresena");        	    	
    		return ;
    	}
	automat.run();        
        $('#message').html(turtle.pathstring);        	
	turtle.normalize_point_succs();
	turtle.create_lineshash();
	
	// test
/*	var mes = "";
	for (var l in turtle.lineshash) {
		mes = mes  + l + "<BR>";
	}    
        $('#message').html(mes);        	*/
	//konec test

	
	if (check_equivalence()) {
		kod = $('#source').val()
		kod = kod.replace(/\+/g,"__PLUS__");
		kod = kod.replace(/\*/g,"__KRAT__");
		kod = kod.replace(/\n/g,";");		
		var q = "session_id="+session_id+"&session_hash="+check_hash+"&move_number="+moveCount+"&move="+kod;	
		sendDataToInterface(q);		
		q = "session_id="+session_id+"&session_hash="+check_hash+"&move_number="+moveCount+"&win=1";
		sendDataToInterface(q);
		after_win();		
		solved = 1;
	} else {
		var q = "session_id="+session_id+"&session_hash="+check_hash+"&move_number="+moveCount+"&move=TurtleAttempt";	
		sendDataToInterface(q);
		moveCount++;
	}
    } catch(ex){
        $('#message').html(ex.message);
        StopDebug();
        $('#tabs').tabs( "select" , 0 );
    }
    setStatus(translate('done'));
    oldStatus = translate('done');
    turtle = null;
    automat = null;
}

// spusteni krokovani 
function stepRun() {   
  $('#tabs').tabs( "select" , 1);
  if ($('#timerButton').attr('checked')) {
        setStatus(translate('krokuji_automat').replace('%d',speedDebug));
        timerLogo = setInterval(StartDebug, speedDebug);        
  } else {
        setStatus(translate('krokuji_manual'));
        StartDebug();
  }
}

function StartDebug() {
    if(automat == null) {
        $('#source').val(editor.getCode());
        $('#message').html("");
//        var canvas = $('#canvas');
        var offset = canvas.position(); //  offset();
        if(arrowCanvas != null) {
            arrowCanvas.remove();
        }
        if(turtle != null) {
            turtle.clean();
            turtle = null;
        }
        arrowCanvas = canvas.clone().attr('id','canvasArrow')
              .prependTo(canvas.parent())
              .css({position:'absolute', top: offset.top, left: offset.left, border: '1px #000 solid', cursor: 'auto'});
        turtle = new Turtle(canvas, "#000000", arrowCanvas);
        turtle.clean();
        automat = new ParserSource(turtle, $('#source').val());
        automat.onChangeRow = function(line){
          goLine(line);
        };
    }
    try {
        if(!automat.step()) {
            //turtle = null;
            StopDebug();
        }else{
            var res = automat.getAllVar();
            var ss = ""; //counter = " + counter + "<br>";
            for(var name in res) {
/*                if(name[0] == '_' && name != '_counter') continue; */
		if (name[0] == ':' || name == '_counter') {
	                ss = ss + name + " = <strong>" + res[name] + "</strong><br>";
		}	
            }
            counter = counter + 1;
            $('#watch').html(ss);
        }
    } catch(ex){
        $('#message').html(ex.message);
        StopDebug();
        $('#tabs').tabs( "select" , 0 );
    }
}

function StopDebug() {  
    automat = null;
    if(redLine!=null) {
        redLine.remove();
    }
    redLine = null;        
    //turtle.draw(turtle.canvas);
    if(timerLogo!=null) {
     clearInterval(timerLogo);
    }
    counter = 0;
    arrowCanvas = null;

    setStatus(translate('done'));
    $( "#play, #debug" ).button({disabled: false});
    $('#pause').attr('checked', false).button( "refresh" );
    $( "#pause, #stop" ).button({disabled: true});
    paused = false;
    
}

// Nacitani prikladu
function LoadExamplesList() {
    var exm = $('#examples');
    for(var iLoop=0; iLoop < examplesList.length; iLoop++) {
        exm.append('<a href="simulator/logo/examples/'+examplesList[iLoop]+'.logo"><img src="simulator/logo/examples/'+examplesList[iLoop]+'.png" alt="'+examplesList[iLoop]+'" title="'+examplesList[iLoop]+'"></a>');
        //examplesList
    }
    $('a', exm).click(function(){
       $.get($(this).attr('href'), function(data) {
          $('#source').val(editor.getCode());
          editor.setCode(data);
        });
        return false;
    });
}

// zmena velikosti panelu - toto ted asi nefunguje
function ResizePanels() {
   var height = getCookie('panelHeight');
   if(height!=null) {
         height =  new Number(height);
         $('#sourceWrapper').height(height);
         $('#canvas, #canvasArrow').attr('height', height);
   }
   var pom = getCookie('panelWidth');
    if(pom!=null) {
        var width = ($('#wrapper').width()-20);
        $('#canvas, #canvasArrow').attr('width', width*pom);
        $('#sourceWrapper').width(width*(1-pom));
    } else {
        var width = ($('#wrapper').width()-20)/2;
        $('#canvas, #canvasArrow').attr('width', width);
        $('#sourceWrapper').width(width);
    }
}

// preklad textu
function TranslateText() {
   $('.transText').each(function(i, el) {
     $(el).html(translate(el.id));
   })


}

// Odchyceni udalosti tlacitek
function setEventForElemets() {
   // Tabs
  $('#tabs').tabs({
        ajaxOptions: {
                error: function( xhr, status, index, anchor ) {
                        $( anchor.hash ).html(
                                "Couldn't load this tab.  File with syntax's help isn't found for this language." );
                }
        }
  });

  $( "#play" ).button({
        text: false,
        label: translate('drawButtonLabel'),
        icons: {
                primary: "ui-icon-play"
        }
  }).click(run)
  .mouseover(function(){setStatus(translate('drawButtonDescription'))})
  .mouseout(setOldStatus);

  $( "#debug" ).button({
            text: false,
            label: translate('debugButtonLabel'),
            icons: {
                    primary: "ui-icon-seek-next"
            }
  }).click(function(){
      if(automat == null) {
        if($('#timerButton').attr('checked')) {
           $( "#debug" ).button({ disabled: true });
           $( "#pause" ).button({ disabled: false });
        } else {
            $( "#debug" ).button({ disabled: false });
            $( "#pause" ).button({ disabled: true });
        }
        $( "#play" ).button({ disabled: true });
        $( "#stop" ).button({ disabled: false });        
      }
      stepRun();
  })
  .mouseover(function(){setStatus(translate('debugButtonDescription'))})
  .mouseout(setOldStatus);

  $( "#pause" ).button({
        text: false,
        label: translate('pauseButtonLabel'),
        disabled: true,
        icons: {
                primary: "ui-icon-pause"
        }
  }).click(function() {
      if($('#pause').attr('checked')) {
          setStatus(translate('paused'));
          clearInterval(timerLogo);
          paused = true;          
      } else {
          if($('#timerButton').attr('checked')) {
              setStatus(translate('krokuji_automat').replace('%d',speedDebug));
          }else{
              setStatus(translate('krokuji_manual'));
          }
          timerLogo = setInterval(StartDebug, speedDebug);
          paused = false;
      }      
  });
  $('label[for=pause]')
  .mouseover(function(){setStatus(translate('pauseButtonDescription'))})
  .mouseout(setOldStatus);

  $( "#stop" ).button({
            text: false,
            disabled: true,
            label: translate('stopButtonLabel'),
            icons: {
                    primary: "ui-icon-stop"
            }
  }).click(function() {
      StopDebug();
      setStatus(translate('stoped'));
  })
  .mouseover(function(){setStatus(translate('stopButtonDescription'))})
  .mouseout(setOldStatus);

  $('#timerButton').button({
            text: false,
            label: translate('timerButtonLabel'),
            icons: {
                    primary: "ui-icon-clock"
            }
    }).click(function() {      
      $( "#slider-range-min" ).slider( "option", "disabled", !($('#timerButton').attr('checked')));
      $('#slider-titile').toggleClass('disabled');
      if(automat != null) {
          if($('#timerButton').attr('checked')) {
              setStatus(translate('krokuji_automat').replace('%d',speedDebug));
              $( "#pause" ).button({ disabled: false });
              $( "#debug" ).button({ disabled: true });
              timerLogo = setInterval(StartDebug, speedDebug);
          } else {
              setStatus(translate('krokuji_manual'));
              $( "#pause" ).button({ disabled: true });
              $( "#debug" ).button({ disabled: false });
              clearInterval(timerLogo);
          }
      }
    });
 $('label[for=timerButton]')
    .mouseover(function(){setStatus(translate('timerButtonDescription'))})
    .mouseout(setOldStatus);

    $( "#slider-range-min" ).slider({
            range: "min",
            value: speedDebug,            
            min: 100,
            max: 1000,
            slide: function( event, ui ) {
                    $( "#timerValue" ).html( ui.value );                    
            },
            start: function (event, ui) {
                if(timerLogo != null && automat != null) {
                   clearInterval(timerLogo);                   
                }
            },
            stop: function (event, ui) {
                speedDebug = ui.value;
                if(automat != null) {
                    setStatus(translate('krokuji_automat').replace('%d',speedDebug));
                    timerLogo = setInterval(StartDebug, speedDebug);                    
                }
            }
    });

 $('#slider-titile')
    .mouseover(function(){setStatus(translate('speedButtonDescription'))})
    .mouseout(setOldStatus)
    .attr('title', translate('speedButtonLabel'));
   
//toto asi taky nefunguje - odstraneno
 $('#resizableBarX').mousedown(function(ex){
        if(automat != null) return false;
        var ox = ex.pageX;
        var cc = $('#canvas, #canvasArrow');
        var sw = $('#sourceWrapper');
        $('body').mousemove(function(ee){
            var x =  ox - ee.pageX;
            //var y = ox.PageY - ee.PageY;
            ox =  ee.pageX;
            //oY =  ee.PageY;            
            cc.attr('width', cc.attr('width') - x);
            sw.width(sw.width() + x);
        }).mouseup(function(){
            $(this).unbind('mousemove');
            //alert(cc.attr('width')/sw.width());
            setCookie('panelWidth',cc.attr('width')/($('#wrapper').width()-20), 300);
        });
    })

//resizebar odstranen
 $('#resizableBarY').mousedown(function(ex){
        if(automat != null) return false;
        var oy = ex.pageY;
        var cc = $('#canvas, #canvasArrow');
        var sw = $('#sourceWrapper');
        $('body').mousemove(function(ee){
            var y =  oy - ee.pageY;
            oy =  ee.pageY;
            cc.attr('height', cc.attr('height') - y);
            sw.height(sw.height() - y);
        }).mouseup(function(){
            $(this).unbind('mousemove');
            setCookie('panelHeight',sw.height(), 300);
        });
    })    

 $('timerValue').html(speedDebug);
 $('#slider-range-min').slider('option', 'disabled', !($('#timerButton').attr('checked')));
 $('#pause').attr('checked', false).button( "refresh" );
 if($('#timerButton').attr('checked')) {
     $('#slider-titile').removeClass('disabled');
  }   	
}

// inicializace editoru
var editor = null;
function initEditor() {
  editor = CodeMirror.fromTextArea('source', {
    height: "100%",
//    parserfile: "../contrib/logo/js/parsesql.js",
    parserfile: "../contrib/logo/js/parsesql.js",
    stylesheet: "simulator/logo/lib/code-mirror-0.9/contrib/logo/css/sqlcolors.css?"+(new Date()).getTime(),
    path: "simulator/logo/lib/code-mirror-0.9/js/",
    lineNumbers: true,
    tabMode: "spaces",
    textWrapping: false   
  });
}

$(window).resize(ResizePanels);

// main metoda
$(document).ready(function(){    
    initEditor();
    ResizePanels();
    TranslateText();
    setEventForElemets();
    LoadExamplesList();    
    $('#tabs').tabs( "select" , 3);	// na zacatky vybrat syntax

    $.get('simulator/logo/lang/'+lang+'/syntax.html',function(data) {
          $('#syntax').html(data);
    });

    // Radkuv hack pattern jako dalsi canvas
    patternCanvas = $('#canvas');
    var offset = patternCanvas.position(); 
    canvas = patternCanvas.clone().attr('id','patternCanvas')
              .prependTo(patternCanvas.parent())
              .css({position:'absolute', top: offset.top, left: offset.left, border: '1px #000 solid', cursor: 'auto'});

    patternTurtle = new Turtle(patternCanvas, "#ff6666");   
   //  od-obfuskace reseni - reverse a nahrada @ za novy radek
    var splittext = qt42.split("");
    var revertext = splittext.reverse();   
    var sol = revertext.join("");
    sol = sol.replace(/@/g, "\n");
    patternAutomat = new ParserSource(patternTurtle, "hideturtle \n " + sol);    
    patternAutomat.run();
    patternTurtle.normalize_point_succs();
    patternTurtle.create_lineshash();

//    turtle = new Turtle($('#canvas'));   
    turtle = new Turtle(canvas);   
    turtle.draw();


});
