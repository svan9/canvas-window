const canvas = document.getElementById("canvas");
canvas.width = $(canvas).width();
canvas.height = $(canvas).height();
const ctx = canvas.getContext("2d");

class ComponentsRow {
    constructor() {
        this.buttons = [];
    }
    /**
     * @typedef {string} hex
     */

    /**
     * @typedef {CWindowActionAPI}
     * @prop {boolean} CLOSE
     */
    /**
     * @typedef ButtonAPI
     * @prop {int} x
     * @prop {int} y
     * @prop {int} width
     * @prop {int} height
     * @prop {hex} color
     * @prop {hex} border
     * @prop {Path2D} path
     * @prop {Image} img
     * @prop {function(): CWindowActionAPI} onClick
     * @prop {boolean?} alignLeft
     */

    /**
     * @param {ButtonAPI} button
     */
    addButton(button) {
        this.buttons.push(button);
        return this;
    }

    static isButtonDown(button, x, y) {
        if (
            x > button.x &&
            y > button.y &&
            x < button.width + button.x &&
            y < button.height + button.y
        )
            return true;
        return false;
    }

    isClear() {
        if (this.buttons.length == 0) return true;
        return false;
    }
}

class CWindow {
    /**
     *
     * @param {string} title
     * @param {int} width
     * @param {int} height
     */
    constructor(title, width, height) {
        this.title = title;
        this.width = width;
        this.height = height;
        /**
         * @type {int}
         */
        this.x = 0;
        /**
         * @type {int}
         */
        this.y = 0;
        /**
         * @type {hex}
         */
        this.color = "#ffffff";
        /**
         * @type {hex?}
         */
        this.border = null;
        this.attrs = {};
        this.attrs_temp = {};
        this.components = new ComponentsRow();
    }

    /**
     * @param {ButtonAPI} button
     */
    addButton(button) {
        this.components.addButton(button);
        return this;
    }

    /**
     *
     * @param {string} name
     * @param {object|undefined} value
     * @param {boolean} isTemp
     */
    attr(name, value, isTemp) {
        if (isTemp) {
            if (value == undefined) {
                if (this.attrs_temp[name] == undefined) return undefined;
                return this.attrs_temp[name];
            }
            this.attrs_temp[name] = value;
            return this;
        }
        if (value == undefined) {
            if (this.attrs[name] == undefined) return undefined;
            return this.attrs[name];
        }
        this.attrs[name] = value;
        return this;
    }

    /**
     *
     * @param {int} x
     * @param {int} y
     * @returns
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }

    static rgbToHex(r, g, b) {
        return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
    }

    /**
     *
     * @param {string|[int32, int32, int32]} color
     */
    setBGColor(color) {
        this.color = color;
        if (typeof color != "string") this.color = CWindow.rgbToHex(color);
        return this;
    }

    /**
     *
     * @param {string|[int32, int32, int32]} color
     */
    setBorder(color) {
        this.border = color;
        if (typeof color != "string") this.border = CWindow.rgbToHex(color);
        return this;
    }
}
const uniqID = (() => {
    let i = 0;
    return () => {
        return i++;
    };
})();

class CWindowRegister {
    constructor() {
        /**
         * @type { Array<CWindow> }
         */
        this.register = [];
    }
    /**
     *
     * @param {CWindow} cwindow
     */
    append(cwindow) {
        const id = uniqID();
        this.register.push([cwindow, id]);
        return id;
    }

    /**
     *
     * @param {function(Array<CWindow>, function(Array<CWindow>, int): CWindow|undefined): Array<CWindow>} fn
     */
    updateRegister(fn) {
        /**
         *
         * @param {Array<CWindow>} array
         * @param {int} ID
         * @returns { CWindow|undefined }
         */
        const getWindowById = function (array, ID) {
            for (const win of array) if (win[1] == ID) return win;
            return undefined;
        };

        this.register = fn(this.register, getWindowById);
    }

    /**
     *
     * @param { function([CWindow, int]): boolean } cond
     * @param { function(CWindow): CWindow } fn
     * @returns {int}
     *
     * @description status code
     */
    updateWindow(cond, fn) {
        for (const win in this.register)
            if (cond(this.register[win])) {
                const wn = fn(this.register[win][0]);
                if (wn == null) return 200;
                this.register[win][0] = wn;
                return 200;
            }
        return 404;
    }

    /**
     *
     * @param { function([CWindow, int]): boolean } cond
     * @param { function(CWindow): CWindow } fn
     * @returns {int}
     *
     * @description status code
     */
    removeWindow(cond) {
        for (const win in this.register)
            if (cond(this.register[win])) {
                this.register.splice(win, 1);
                return 200;
            }
        return 404;
    }

    callUpdate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (const wit of this.register) {
            const win = wit[0];
            ctx.fillStyle = win.color;
            ctx.fillRect(win.x, win.y, win.width, win.height);
            if (win.border != null) {
                ctx.strokeStyle = win.border;
                ctx.strokeRect(win.x, win.y, win.width, win.height);
            }
            if (!win.components.isClear()) {
                const buttons = win.components.buttons;
                for (const btn of buttons) {
                    if (!(btn.alignLeft == null || btn.alignLeft == true)) {
                        const offset_x = win.x + win.width;
                        const x = offset_x - btn.x - btn.width;
                        const y = win.y - btn.y;
                        ctx.fillStyle = btn.color;
                        ctx.fillRect(x, y, btn.width, btn.height);
                        ctx.strokeStyle = btn.color;
                        ctx.strokeRect(x, y, btn.width, btn.height);
                        if (btn.img != null) {
                            if (btn.imgOptions.img != null)
                                ctx.strokeStyle = ctx.fillStyle = btn.imgOptions.color;
                            if (btn.imgOptions.margin != null) {
                                const qmargin = btn.imgOptions.margin * 0.5;
                                ctx.drawImage(
                                    btn.img,
                                    x + qmargin,
                                    y + qmargin,
                                    btn.width - btn.imgOptions.margin,
                                    btn.height - btn.imgOptions.margin
                                );
                            } else ctx.drawImage(btn.img, x, y, btn.width, btn.height);
                        }
                    } else {
                        const x = btn.x + btn.width;
                        const y = win.y - btn.y;
                        ctx.fillStyle = btn.color;
                        ctx.fillRect(x, y, btn.width, btn.height);
                        ctx.strokeStyle = btn.color;
                        ctx.strokeRect(x, y, btn.width, btn.height);
                        if (btn.img != null) {
                            if (btn.imgOptions.img != null)
                                ctx.strokeStyle = ctx.fillStyle = btn.imgOptions.color;
                            if (btn.imgOptions.margin != null) {
                                const qmargin = btn.imgOptions.margin * 0.5;
                                ctx.drawImage(
                                    btn.img,
                                    x + qmargin,
                                    y + qmargin,
                                    btn.width - qmargin,
                                    btn.height - qmargin
                                );
                            } else ctx.drawImage(btn.img, x, y, btn.width, btn.height);
                        }
                    }
                    if (btn.path != null) {
                        ctx.stroke(btn.path);
                    }
                }
            }
        }
    }

    /**
     *
     * @param {int} x
     * @param {int} y
     * @returns {CWindow|undefined}
     */
    getWindowByPos(x, y) {
        for (const wit of this.register) {
            const win = wit[0];
            if (x > win.x && y > win.y && x < win.width + win.x && y < win.height + win.y)
                return win;
        }
        return undefined;
    }

    /**
     *
     * @param {CWindow} win
     * @param {int} x
     * @param {int} y
     * @returns {boolean}
     */
    static isWindowDown(win, x, y) {
        // console.log(win.x, win.y, x, y)
        if (x > win.x && y > win.y && x < win.width + win.x && y < win.height + win.y)
            return true;

        return false;
    }

    clearTemp() {
        for (const wit in this.register) this.register[wit][0].attrs_temp = {};
    }
}
const crossIMG = new Image();
crossIMG.src = "./cross.svg";

const WindowRegister = new CWindowRegister();
const Frame = new CWindow("Frame", 300, 300)
    .setPosition(100, 100)
    .setBGColor("#111")
    .setBorder("#fff")
    .addButton({
        x: 0,
        y: 0,
        width: 20,
        height: 20,
        color: "#ccc",
        border: "#fff",
        alignLeft: false,
        img: crossIMG,
        imgOptions: { color: "#fff", margin: 6 },
        onClick: () => {
            return { CLOSE: true };
        },
    });

WindowRegister.append(Frame);

window.onload = function () {
    WindowRegister.callUpdate();
};

var pressed = false;
var win = undefined;

document.addEventListener("mouseout", function () {
    pressed = false;
});

$(canvas).on("mousedown", function (e) {
    const x = e.originalEvent.clientX;
    const y = e.originalEvent.clientY;
    pressed = true;
    WindowRegister.clearTemp();
    win = WindowRegister.getWindowByPos(x, y);
});

$(canvas).on("mouseup", function (e) {
    const x = e.originalEvent.clientX;
    const y = e.originalEvent.clientY;
    WindowRegister.updateWindow(
        (wn) => wn[0] == win,
        function (wn) {
            if (wn.attr("mouseOffset", undefined, true) == undefined)
                wn.attr("mouseOffset", { x: x - win.x, y: y - win.y }, true);
            const offset = wn.attr("mouseOffset", undefined, true);
            wn.setPosition(x - offset.x, y - offset.y);
            return wn;
        }
    );
    WindowRegister.callUpdate();
    pressed = false;
    win = undefined;
    WindowRegister.clearTemp();
});

$(canvas).on("mousemove", function (e) {
    if (!pressed) return;
    const x = e.originalEvent.clientX;
    const y = e.originalEvent.clientY;
    if (win == undefined) return;
    WindowRegister.updateWindow(
        (wn) => CWindowRegister.isWindowDown(wn[0], x, y),
        function (wn) {
            if (wn.attr("mouseOffset", undefined, true) == undefined)
                wn.attr("mouseOffset", { x: x - win.x, y: y - win.y }, true);
            const offset = wn.attr("mouseOffset", undefined, true);
            wn.setPosition(x - offset.x, y - offset.y);
            return wn;
        }
    );
    WindowRegister.callUpdate();
});

$(canvas).on("click", function (e) {
    const x = e.originalEvent.clientX;
    const y = e.originalEvent.clientY;
    WindowRegister.updateWindow(
        (wn) => CWindowRegister.isWindowDown(wn[0], x, y),
        function (wn) {
            if (!wn.components.isClear()) {
                var cmp = wn.components.buttons.filter(
                    (e) =>
                        (e.alignLeft == false &&
                            wn.x + wn.width - e.x - e.width < x &&
                            wn.y - e.y < y &&
                            wn.x + wn.width - e.x > x &&
                            wn.y - e.y + e.height > y) ||
                        (e.alignLeft != false &&
                            wn.x + e.x < x &&
                            wn.y + e.y < y &&
                            wn.x + e.x + e.width > x &&
                            wn.y + e.y + e.height > y)
                );
                for (const btn of cmp) {
                    const att = btn.onClick();
                    if (att.CLOSE) {
                        WindowRegister.removeWindow((w) => w[0] == wn);
                        return null;
                    }
                }
            }
            return wn;
        }
    );
    WindowRegister.callUpdate();
});

window.onresize = function () {
    window.location.reload();
};
