function loadFile(){
    var param = location.search.split('level=')[1];



    if (param && param != "") {
        url = basePath + param;
    }else {
        alert("no file to load ... \n\nspecify a filename in the url using \n ?level=...\n\n -> Loading default level 00S");
        url = basePath + "00S";
    }

    console.log("loading url " + url);
    filename = url.split("/")[url.split("/").length-1];

    GetBinaryFile( url, function( objBinaryFile ) {
        if(objBinaryFile) {

            console.log("got file");
            console.log("Content Length: " + objBinaryFile.ContentLength + " (bytes)");
            stream = objBinaryFile;

            printFile();
            //var b =  binaryStream.charCodeAt( x ) & 0xFF;
        } else {
            alert('There was some error while trying to fetch the binary file!');
        }
    });

}

function printFile(){
    var showColors = false;
    var isKingsoft = false;
    var showHex = true;

    var bytes = [];
    var hex = [];
    binaryStream = stream.Content;

    var firstline = [];
    for (var i = 0, len = stream.ContentLength; i<len;i++){
        var b = binaryStream.charCodeAt(i) & 0xFF;

        if (isKingsoft){
            // simple crypt?
            b = b-i


            while (b<0){
                b += 256;
            }
            if (b>128) b = b-128


            if (i<64){
                firstline.push(b);
            }

            var mod = firstline[i%64];

            b=b-mod;



            if (i>=64){
                var j = ((i-2)%8)*2
                b = (b - j)+13;

                mod = i%64
                if (mod == 0) b=b-1;

                if (mod == 1) b=b+6;

                // dependend on file name?
            }



            while (b>255){
                b -= 256;
            }

            while (b<0){
                b += 256;
            }
        }


        if (showHex){
            if (isKingsoft){
                var h = convertKingsoft(b);
                if (h == "**"){
                    h = b.toString(16);
                    if (h.length ==1) h = "0"+h;
                }

                if (showColors){
                    h = objectToSprite(h);
                }
            }

            h = b.toString(16);
            if (h.length ==1) h = "0"+h;


            bytes.push(h);
        }else{
            bytes.push(b);
        }


    }

    var glue = " ";

    var output = document.getElementById("output");
    output.innerHTML = bytes.join(glue);
}

function convertLevel(){
    var bytes = [];
    var hex = [];
    var binaryStream = stream.Content;

    var html = "";
    var unknown = [];

    var levelProperties = {};
    var playerIndex = 0;
    var player2Index = 0;

    var levelOffset = document.getElementById("leveloffset").value;
    var binaryOffset = levelOffset * 2172;

    // properties
    var propertyIndex = binaryOffset + ((32*64) + (4*9));

    levelProperties.width 	= 64;
    levelProperties.height 	= 32;
    levelProperties.emeraldValue 	= byteAt(propertyIndex);
    levelProperties.diamondValue 	= byteAt(propertyIndex+1);
    levelProperties.robotValue 		= byteAt(propertyIndex+2);
    levelProperties.shipValue 		= byteAt(propertyIndex+3);
    levelProperties.bugValue 		= byteAt(propertyIndex+4);
    levelProperties.yamValue 		= byteAt(propertyIndex+5);
    levelProperties.nutValue 		= byteAt(propertyIndex+6);
    levelProperties.dynamiteValue 	= byteAt(propertyIndex+7);
    levelProperties.keyValue 		= byteAt(propertyIndex+8);
    levelProperties.timeBonus 		= byteAt(propertyIndex+9);
    levelProperties.availableTime 	= byteAt(propertyIndex+10);
    levelProperties.diamondstocollect 	= byteAt(propertyIndex+11);
    playerIndex	= (byteAt(propertyIndex+12) * 256) + byteAt(propertyIndex+13);
    player2Index	= (byteAt(propertyIndex+14) * 256) + byteAt(propertyIndex+15);
    levelProperties.amoebaGrowthRate = (byteAt(propertyIndex+16) * 256) + byteAt(propertyIndex+17);
    levelProperties.magicWalltime = (byteAt(propertyIndex+18) * 256) + byteAt(propertyIndex+19);
    levelProperties.wheelTime = (byteAt(propertyIndex+20) * 256) + byteAt(propertyIndex+21);


    var renderType = document.getElementById("render").value;


    // level data
    for (var y=0;y<32;y++){
        var line = "";
        for (var x = 0; x<64;x++){
            var index = (y*64)+x;
            var b = byteAt(binaryOffset + index);

            var code = convertEmcV1(b);
            if (index == playerIndex) code = "P1";



            if (code == "**") unknown.push(b);

            if (renderType == "Sprites"){
                code = objectToSprite(code,toHex(b));
            }


            line += code;
        }



        if (renderType == "Json"){
            line = '"' + line + '"';
            if (y<31) line += ",";

        }

        line += "<br>";
        html += line;
    }

    var output = document.getElementById("level");

    if (renderType == "Json"){
        var json = "{<br>";
        json += '"name" : "' + filename + "_" + levelOffset +'",<br>';
        json += '"width" :' + levelProperties.width + ",<br>";
        json += '"height" :' + levelProperties.height + ",<br>";
        json += '"minimumScore" :' + levelProperties.diamondstocollect + ",<br>";
        json += '"mapStructure" : {<br>';
        json += '  "charCount" : 2 <br>';
        json += '},<br>';
        json += '"map" : [ <br>';

        html = json + html;

        json = ']<br>';
        json += '}<br>'

        html = html + json;
    }

    if (renderType == "Sprites"){
        output.style.width = (64*16) + "px"
    }

    output.innerHTML = html;

    var resultOutput = document.getElementById("result");
    if (unknown.length == 0){
        resultOutput.innerHTML = "Success!";
        resultOutput.className = "success";
    }else{
        resultOutput.innerHTML = "<br>Unknown Objects: " + unknown.join(", ");
        resultOutput.className = "error";
    }

}

function objectToSprite(s,b){
    var sprite = objectCodeToSprite(s);
    var x = (sprite.spriteindex % 40) * 16;
    var y = (Math.floor(sprite.spriteindex/40)) * 16;

    if (sprite.name != "unknown") b="";

    var style = "background-position: -" + x + "px -" + y + "px";
    return '<div class="tile '+sprite.name+'" style="'+style+'">' + b + '</div>';
}

function objectCodeToSprite(s){
    var map = {
        "  " : {name: "space", spriteindex: 0},
        " f" : {name: "fake_space", spriteindex: 37},
        "Ws" : {name: "steel_wall", spriteindex: 30},
        "Wi" : {name: "invisible_wall", spriteindex: 37},
        "WH" : {name: "expanging_wall_vertical", spriteindex: 6*40+14},
        "WS" : {name: "slippery_wall", spriteindex: 38},
        "Ww" : {name: "stone_wall", spriteindex: 8},
        "Wm" : {name: "magic_wall", spriteindex: 157},
        "rr" : {name: "rock", spriteindex: 28},
        "ul" : {name: "rock_move_left", spriteindex: 28},
        "ur" : {name: "rock_move_right", spriteindex: 28},
        ".." : {name: "dirt", spriteindex: 9},
        ".!" : {name: "dirt_deadly", spriteindex: 12*40+19},
        "Q." : {name: "quicksand", spriteindex: 26},
        "Qr" : {name: "quicksand_stone", spriteindex: 244},
        "$1" : {name: "emerald", spriteindex: 33},
        ">1" : {name: "emerald_collected", spriteindex: 96},
        "$3" : {name: "diamond", spriteindex: 13},
        "Nu" : {name: "nut", spriteindex: 24},
        "P1" : {name: "player", spriteindex: 25},
        "XX" : {name: "exit", spriteindex: 16},
        "X2" : {name: "exit_open", spriteindex: 156},
        "Yu" : {name: "yam_up", spriteindex: 15},
        "Yd" : {name: "yam_down", spriteindex: 15},
        "Yl" : {name: "yam_left", spriteindex: 15},
        "Yr" : {name: "yam_right", spriteindex: 15},
        "Bo" : {name: "bomb", spriteindex: 7},
        "Ol" : {name: "bomb_move_left", spriteindex: 7},
        "Or" : {name: "bomb_move_right", spriteindex: 7},
        "Bu" : {name: "bug_up", spriteindex: 118},
        "Bl" : {name: "bug_left", spriteindex: 115},
        "Br" : {name: "bug_right", spriteindex: 119},
        "Bd" : {name: "bug_down", spriteindex: 120},
        "Tu" : {name: "tank_up", spriteindex: 220},
        "Tr" : {name: "tank_right", spriteindex: 222},
        "Td" : {name: "tank_down", spriteindex: 221},
        "Tl" : {name: "tank_left", spriteindex: 29},
        "Ro" : {name: "robot", spriteindex: 27},
        "Rw" : {name: "robot_wheel", spriteindex: 31},
        "an" : {name: "android", spriteindex: (13*40) + 8},
        "Aa" : {name: "acid", spriteindex: 32},
        "Ai" : {name: "amoeba_invisible", spriteindex: 150},
        "a1" : {name: "amoeba_1", spriteindex: 6},
        "a." : {name: "amoeba_drop", spriteindex: 145},
        "A1" : {name: "Acidbox_topleft", spriteindex: 4},
        "A2" : {name: "Acidbox_bottomleft", spriteindex: 1},
        "A3" : {name: "Acidbox_bottom", spriteindex: 2},
        "A4" : {name: "Acidbox_bottomright", spriteindex: 3},
        "A5" : {name: "Acidbox_topright", spriteindex: 5},
        "Sp" : {name: "spring", spriteindex: 13*40+3},
        "Pl" : {name: "spring_move_left", spriteindex: 13*40+3},
        "Pr" : {name: "spring_move_right", spriteindex: 13*40+3},
        "Kg" : {name: "key_green", spriteindex: 20},
        "Kr" : {name: "key_red", spriteindex: 21},
        "Kb" : {name: "key_blue", spriteindex: 19},
        "Ky" : {name: "key_yellow", spriteindex: 22},
        "Kp" : {name: "key_purple", spriteindex: 12*40+20},
        "Kn" : {name: "key_brown", spriteindex: 11*40+36},
        "Kk" : {name: "key_black", spriteindex: 9*40+39},
        "Kw" : {name: "key_white", spriteindex: 7*40+27},
        "Dg" : {name: "door_green", spriteindex: 12},
        "Dr" : {name: "door_red", spriteindex: 36},
        "Db" : {name: "door_blue", spriteindex: 10},
        "Dy" : {name: "door_yellow", spriteindex: 35},
        "Dp" : {name: "door_purple", spriteindex: 13*40},
        "Dk" : {name: "door_black", spriteindex: 13*40+1},
        "Dn" : {name: "door_brown", spriteindex: 12*40+16},
        "Dw" : {name: "door_white", spriteindex: 7*40+28},
        "dg" : {name: "door_mystery_green", spriteindex: 11},
        "dr" : {name: "door_mystery_red", spriteindex: 11},
        "db" : {name: "door_mystery_blue", spriteindex: 11},
        "dy" : {name: "door_mystery_yellow", spriteindex: 11},
        "dw" : {name: "door_mystery_white", spriteindex: 11},
        "dp" : {name: "door_mystery_purple", spriteindex: 11},
        "dk" : {name: "door_mystery_black", spriteindex: 11},
        "dn" : {name: "door_mystery_brown", spriteindex: 11},
        "dD" : {name: "dynamite", spriteindex: 14},
        "dA" : {name: "dynamite_active", spriteindex: 85},
        "!1" : {name: "dynamite_active", spriteindex: 85},
        "Qa" : {name: "magic_wall_active", spriteindex: (12*40) + 30},
        "Le" : {name: "lenses", spriteindex: (12*40) + 14},
        "Ba" : {name: "balloon", spriteindex: 12*40+18},
        "_A" : {name: "A", spriteindex: 187},
        "_B" : {name: "B", spriteindex: 188},
        "_C" : {name: "C", spriteindex: 189},
        "_D" : {name: "D", spriteindex: 190},
        "_E" : {name: "E", spriteindex: 191},
        "_F" : {name: "F", spriteindex: 192},
        "_G" : {name: "G", spriteindex: 193},
        "_H" : {name: "H", spriteindex: 194},
        "_I" : {name: "I", spriteindex: 195},
        "_J" : {name: "J", spriteindex: 196},
        "_K" : {name: "K", spriteindex: 197},
        "_L" : {name: "L", spriteindex: 198},
        "_M" : {name: "M", spriteindex: 199},
        "_N" : {name: "N", spriteindex: 200},
        "_O" : {name: "O", spriteindex: 201},
        "_P" : {name: "P", spriteindex: 202},
        "_Q" : {name: "Q", spriteindex: 203},
        "_R" : {name: "R", spriteindex: 204},
        "_S" : {name: "S", spriteindex: 205},
        "_T" : {name: "T", spriteindex: 206},
        "_U" : {name: "U", spriteindex: 207},
        "_V" : {name: "V", spriteindex: 208},
        "_W" : {name: "W", spriteindex: 209},
        "_X" : {name: "X", spriteindex: 210},
        "_Y" : {name: "Y", spriteindex: 211},
        "_Z" : {name: "Z", spriteindex: 212},
        "_!" : {name: "!", spriteindex: 215},
        "_>" : {name: ">", spriteindex: 217},
        "_0" : {name: "0", spriteindex: 177},
        "_1" : {name: "1", spriteindex: 178},
        "_2" : {name: "2", spriteindex: 179},
        "_3" : {name: "3", spriteindex: 180},
        "_4" : {name: "4", spriteindex: 181},
        "_5" : {name: "5", spriteindex: 182},
        "_6" : {name: "6", spriteindex: 183},
        "_7" : {name: "7", spriteindex: 184},
        "_8" : {name: "8", spriteindex: 185},
        "_9" : {name: "9", spriteindex: 186},
        "#1" : {name: "decor1", spriteindex: 166},
        "#2" : {name: "decor2", spriteindex: 164},
        "#3" : {name: "decor3", spriteindex: 170}

    }
    var result = {name: "unknown", spriteindex: 0}
    if (map[s]){
        result =  map[s];
    }
    return result;
}