var MutableBuffer = require('mutable-buffer'),
    CMD = require('./commands');

class Escpos {

    constructor() {
      this.buffer = new MutableBuffer;
    }

    init() {
        this.buffer.write(CMD.HARDWARE.HW_INIT);
        return this;
    }

    boldOn() {
        this.buffer.write(CMD.TEXT_FORMAT.TXT_BOLD_ON);
        return this;
    }

    boldOff() {
        this.buffer.write(CMD.TEXT_FORMAT.TXT_BOLD_OFF);
        return this;
    }

    marginBottom(size) {
        this.buffer.write(CMD.MARGINS.BOTTOM);
        this.buffer.writeUInt8(size);
        return this;
    }

    marginLeft(size) {
        this.buffer.write(CMD.MARGINS.LEFT);
        this.buffer.writeUInt8(size);
        return this;
    }

    marginRight(size) {
        this.buffer.write(CMD.MARGINS.RIGHT);
        this.buffer.writeUInt8(size);
        return this;
    }

    text(content) {
        this.buffer.write(content);
        return this;
    }

    feed(n = 3) {
        this.buffer.write(new Array(n || 1).fill(CMD.EOL).join(''));
        return this;
    }

    control(ctrl) {
        this.buffer.write(CMD.FEED_CONTROL_SEQUENCES[
            'CTL_' + ctrl.toUpperCase()
        ]);
        return this;
    }

    align(align) {
        this.buffer.write(CMD.TEXT_FORMAT[
            'TXT_ALIGN_' + align.toUpperCase()
        ]);
        return this;
    }

    font(family) {
        this.buffer.write(CMD.TEXT_FORMAT[
            'TXT_FONT_' + family.toUpperCase()
        ]);
        return this;
    }

    size(width, height) {
        if (2 >= width && 2 >= height) {
            this.buffer.write(CMD.TEXT_FORMAT.TXT_NORMAL);
            if (2 == width && 2 == height) {
                this.buffer.write(CMD.TEXT_FORMAT.TXT_4SQUARE);
            } else if (1 == width && 2 == height) {
                this.buffer.write(CMD.TEXT_FORMAT.TXT_2HEIGHT);
            } else if (2 == width && 1 == height) {
                this.buffer.write(CMD.TEXT_FORMAT.TXT_2WIDTH);
            }
        } else {
            this.buffer.write(CMD.TEXT_FORMAT.TXT_CUSTOM_SIZE(width, height));
        }
        return this;
    }

    lineSpace(n = null) {
        if (n === null) {
            this.buffer.write(CMD.LINE_SPACING.LS_DEFAULT);
        } else {
            this.buffer.write(CMD.LINE_SPACING.LS_SET);
            this.buffer.writeUInt8(n);
        }
        return this;
    }

    barcode(code, type = 'CODE128', width = 3, height = 100, position = 'BTH', font = 'B') {
        let convertCode = String(code);
        if (typeof type === 'undefined' || type === null) {
            throw new TypeError('barcode type is required');
        }
        if (type === 'EAN13' && convertCode.length != 12) {
            throw new Error('EAN13 Barcode type requires code length 12');
        }
        if (type === 'EAN8' && convertCode.length != 7) {
            throw new Error('EAN8 Barcode type requires code length 7');
        }
        if (width >= 2 || width <= 6) {
            this.buffer.write(CMD.BARCODE_FORMAT.BARCODE_WIDTH[width]);
        } else {
            this.buffer.write(CMD.BARCODE_FORMAT.BARCODE_WIDTH_DEFAULT);
        }
        if (height >= 1 || height <= 255) {
            this.buffer.write(CMD.BARCODE_FORMAT.BARCODE_HEIGHT(height));
        } else {
            this.buffer.write(CMD.BARCODE_FORMAT.BARCODE_HEIGHT_DEFAULT);
        }
        this.buffer.write(CMD.BARCODE_FORMAT[
            'BARCODE_FONT_' + (font || 'B').toUpperCase()
        ]);
        this.buffer.write(CMD.BARCODE_FORMAT[
            'BARCODE_TXT_' + (position || 'BTH').toUpperCase()
        ]);
        this.buffer.write(CMD.BARCODE_FORMAT[
            'BARCODE_' + ((type || 'EAN13').replace('-', '_').toUpperCase())
        ]);
        let codeBytes = code.split('').map(s => s.charCodeAt(0));
        this.buffer.write(codeBytes.length);
        this.buffer.write(codeBytes);
        this.buffer.write('\x00');
        return this;
    }

    qrcode(code, version = 3, level = 3, size = 8) {
        this.buffer.write(CMD.CODE2D_FORMAT.CODE2D);
        this.buffer.writeUInt8(version);
        this.buffer.writeUInt8(level);
        this.buffer.writeUInt8(size);
        this.buffer.writeUInt16LE(code.length);
        this.buffer.write(code);
        return this;
    }

    hardware(hw) {
        this.buffer.write(CMD.HARDWARE['HW_' + hw]);
        return this.flush();
    }

    cashdraw(pin) {
        this.buffer.write(CMD.CASH_DRAWER[
            'CD_KICK_' + (pin || 2)
        ]);
        return this.flush();
    }

    cut(part, feed) {
        this.feed(feed || 3);
        this.buffer.write(CMD.PAPER[
            part ? 'PAPER_PART_CUT' : 'PAPER_FULL_CUT'
        ]);
        return this.flush();
    }

    flush() {
        return this.buffer.flush();
    }

};

module.exports = Escpos;
