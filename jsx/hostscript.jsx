/**
 * PlaceAll - ExtendScript for Adobe Illustrator
 */

function getPDFPageCount(filePath) {
    try {
        var f = new File(filePath);
        if (!f.exists) return '{"error":"not found","count":1}';
        f.open('r');
        f.encoding = 'BINARY';
        var content = '';
        var max = 512 * 1024;
        var read = 0;
        while (!f.eof && read < max) {
            content += f.read(4096);
            read += 4096;
        }
        f.close();
        var maxCount = 0;
        var idx = 0;
        while (true) {
            var pi = content.indexOf('/Type /Pages', idx);
            if (pi === -1) pi = content.indexOf('/Type/Pages', idx);
            if (pi === -1) break;
            var rs = (pi - 300 > 0) ? pi - 300 : 0;
            var re = (pi + 300 < content.length) ? pi + 300 : content.length;
            var region = content.substring(rs, re);
            var m = region.match(/\/Count\s+(\d+)/);
            if (m) {
                var c = parseInt(m[1], 10);
                if (c > maxCount) maxCount = c;
            }
            idx = pi + 12;
        }
        return '{"count":' + (maxCount > 0 ? maxCount : 1) + '}';
    } catch (e) {
        return '{"error":"' + e.toString().replace(/"/g, '\\"') + '","count":1}';
    }
}

function placeFilesFromJSON(jsonPath) {
    try {
        var f = new File(jsonPath);
        f.open('r');
        f.encoding = 'UTF-8';
        var content = f.read();
        f.close();
        var data = eval('(' + content + ')');
        var files = data.files;
        var layout = data.layout || 'horizontal';
        var spacingPt = data.spacingPt || 14.17;
        var cols = data.cols || 3;
        var createAB = (data.createAB !== false);

        if (app.documents.length === 0) app.documents.add();
        var doc = app.activeDocument;

        var ab0 = doc.artboards[0];
        var r0 = ab0.artboardRect;
        var curX = r0[0];
        var curY = r0[1];
        var isEmptyDoc = (doc.artboards.length === 1 && doc.pageItems.length === 0);

        var colIdx = 0;
        var rowMaxH = 0;
        var placedCount = 0;
        var firstAbSet = false;

        var prev = app.userInteractionLevel;
        app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;

        for (var fi = 0; fi < files.length; fi++) {
            var fd = files[fi];
            var file = new File(fd.path);
            if (!file.exists) continue;
            var isPDF = /\.pdf$/i.test(fd.path);
            var pages = fd.pages;

            for (var pi = 0; pi < pages.length; pi++) {
                if (isPDF) {
                    app.preferences.PDFFileOptions.pageToOpen = pages[pi];
                    app.preferences.PDFFileOptions.pDFCropToBox = PDFBoxType.PDFMEDIABOX;
                }
                var placed = doc.placedItems.add();
                placed.file = file;
                var w = placed.width;
                var h = placed.height;
                placed.position = [curX, curY];

                // Artboard: reuse first empty one or add new
                if (createAB) {
                    var abRect = [curX, curY, curX + w, curY - h];
                    if (isEmptyDoc && !firstAbSet) {
                        ab0.artboardRect = abRect;
                        firstAbSet = true;
                    } else {
                        doc.artboards.add(abRect);
                    }
                }

                placedCount++;

                // Advance position
                if (layout === 'horizontal') {
                    colIdx++;
                    if (h > rowMaxH) rowMaxH = h;
                    if (colIdx >= cols) {
                        // Wrap to next row
                        colIdx = 0;
                        curX = r0[0];
                        curY -= rowMaxH + spacingPt;
                        rowMaxH = 0;
                    } else {
                        curX += w + spacingPt;
                    }
                } else {
                    // vertical
                    curY -= h + spacingPt;
                }
            }
        }

        app.userInteractionLevel = prev;
        return '{"success":true,"placed":' + placedCount + '}';
    } catch (e) {
        try { app.userInteractionLevel = UserInteractionLevel.DISPLAYALERTS; } catch (ex) {}
        return '{"success":false,"error":"' + e.toString().replace(/"/g, '\\"') + '"}';
    }
}
