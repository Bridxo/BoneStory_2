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
var copyTree = function (node) {
    return __assign(__assign({}, node), { children: node.children.map(exports.copyTree) });
};
exports.copyTree = copyTree;
var preOrderTraversal = function (node, cb) {
    cb(node);
    node.children.map(function (child) { return (0, exports.preOrderTraversal)(child, cb); });
};
exports.preOrderTraversal = preOrderTraversal;
var group = function (node, test) {
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
    node.children.map(function (child) { return (0, exports.group)(child, test); });
};
exports.group = group;
//# sourceMappingURL=utils.js.map