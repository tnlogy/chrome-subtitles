function router(request, sender, callback) {
  addOverlay();
}

chrome.extension.onMessage.addListener(router);

var overlay = $("<div></div>");
var area = $("<div></div>");
var areaLeft, areaTop;
var srt;
var initialized = false;

var subUpload = $('<input type="file" id="file" name="files[]"/>')
subUpload.css({background:"white"});
overlay.append(subUpload);
function handleFileSelect(evt) {
  var files = evt.target.files; // FileList object

  var reader = new FileReader();
  reader.onloadend = function (evt) {
    var data = evt.target.result;
    srt = parseSrt(data);
    currentStrIndex = 0;
  }

  reader.readAsText(files[0]);
}

subUpload.on('change', handleFileSelect, false);
subUpload.on('mousedown mousemove mouseup', function (e) { e.stopPropagation(); }, false)

function addOverlay() {
  if(initialized) {
//    overlay.css({pointerEvents: "none"});
    overlay.css({background: "none", opacity: "0.9", height:50});
    area.css({
      left:areaLeft-400,
      top:areaTop-400,
      background: "none",
      border: "400px solid black",
      pointerEvents: "none"
    });
    overlay.show();
    playSubs(srt);
    return;
  }

  var width = $("body").width(), height = $("body").height();
  overlay.css({
    top: "0px", left: "0px",
    position: "fixed",
    width: width + "px",
    height: height + "px",
    background: "#111",
    opacity: "0.5",
    zIndex: "99999999"
  });

  $("body").append(overlay);

  area.css({
    position: "absolute",
    width: "100px",
    height: "100px",
    background:"white"
  });

  overlay.on("mousedown", function (e) {
    areaLeft = e.clientX;
    areaTop = e.clientY;
    area.css({
      left: areaLeft + "px",
      top: areaTop + "px"
    });
    overlay.append(area);
  });

  overlay.on("mousemove", function (e) {
    var w = (e.clientX-areaLeft);
    var h = (e.clientY-areaTop);
    area.css({
      width: w + "px",
      height: h + "px"
    });
    subLine.css({
      width: (w-40) + "px",
      height: h + "px"
    });
  });

  overlay.on("mouseup", function (e) {
    initalized = true;
    overlay.off();
    subLine.css({marginTop: area.height()-54});
    currentStrIndex = 0;
    initialized = true;
    overlay.hide();    
  });
}

var subLine = $("<div></div>")
subLine.css({
  fontSize: "22px",
  color: "white",
  marginLeft: 20,
  marginRight: 20,
  paddingBottom: 2,
  pointerEvents: "none"
})
var line1 = $("<p></p>").css({margin:0, paddingLeft: 10, background: "black"}).css({marginBottom: 5});
var line2 = $("<p></p>").css({margin:0, paddingLeft: 10, background: "black"});
subLine.append(line1).append(line2);
area.append(subLine);

var timer;

$(document).on("keydown", function (e) {
  if(e.keyCode == 39) {
    moveSub();
  } else if(e.keyCode == 37) {
    currentStrIndex -= 2;
    currentStrIndex = Math.max(currentStrIndex, 0)
    moveSub();
  }
})

function moveSub() {
  if(!srt) { return; }
  clearTimeout(timer);
  playSubs(srt, true);
}
var currentStrIndex = 0;

function playSubs(srt, moving) {
  var currentTime = 0;
  if(moving) {
    currentTime = srt[currentStrIndex].start;
  }

  function showNextSub() {
    line1.hide(); line2.hide();
    var sub = srt[currentStrIndex];
    if(sub) {
      currentStrIndex += 1;
      showSub(sub);
    }
  }

  function showSub(sub) {
    timer = setTimeout(function () {
      currentTime = sub.start
      line1.text(sub.line1); line1.show();
      if(sub.line2) { line2.text(sub.line2); line2.show(); }
      timer = setTimeout(showNextSub, sub.end - currentTime);
      currentTime = sub.end;
    }, sub.start - currentTime);
  }

  showNextSub();
}


function parseSrt(data) {
  function toMs(timeStr) {
    var spl = timeStr.split(",");
    var time = spl[0].split(":"), ms = parseInt(spl[1], 10);
    var h = parseInt(time[0], 10), m = parseInt(time[1], 10), s = parseInt(time[2], 10);
    return ms + (s + m*60 + h*60*60)*1000;
  }

  var lines = data.split("\n");
  var res = [];

  for(var i = 0; i < lines.length; i++) {
    var line = lines[i];
    var m = line.match(/(.*)\s-->\s(.*)/)
    if(m) {
      var start = m[1], end = m[2];
      var sub = {start: toMs(start), end: toMs(end)};

      var line1 = lines[i+1];
      var line2 = lines[i+2];
      sub.line1 = line1;
      res.push(sub);
      i += 2;
      if(line2.trim().length > 0) {
        sub.line2 = line2;
        i += 1;
      }
    }
  }
  return res;
}
