"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.group = exports.preOrderTraversal = exports.copyTree = void 0;
exports.copyTree = function (node) {
    return __assign(__assign({}, node), { children: node.children.map(exports.copyTree) });
};
exports.preOrderTraversal = function (node, cb) {
    cb(node);
    node.children.map(function (child) { return exports.preOrderTraversal(child, cb); });
};
exports.group = function (node, test) {
    var _a, _b;
    var merged = false;
    do {
        merged = false;
        for (var _i = 0, _c = node.children; _i < _c.length; _i++) {
            var child = _c[_i];
            if (test(node, child)) {
                node.children.splice(node.children.indexOf(child), 1);
                (_a = node.children).push.apply(_a, child.children);
                (_b = node.wrappedNodes).push.apply(_b, child.wrappedNodes);
                merged = true;
                break;
            }
        }
    } while (merged);
    node.children.map(function (child) { return exports.group(child, test); });
};
//# sourceMappingURL=utils.js.map