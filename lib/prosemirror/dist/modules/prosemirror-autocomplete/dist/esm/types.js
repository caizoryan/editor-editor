const KEEP_OPEN = 'KEEP_OPEN';
var ActionKind;
(function (ActionKind) {
    ActionKind["open"] = "open";
    ActionKind["close"] = "close";
    ActionKind["filter"] = "filter";
    ActionKind["up"] = "ArrowUp";
    ActionKind["down"] = "ArrowDown";
    ActionKind["left"] = "ArrowLeft";
    ActionKind["right"] = "ArrowRight";
    ActionKind["enter"] = "enter";
})(ActionKind || (ActionKind = {}));

export { ActionKind, KEEP_OPEN };
