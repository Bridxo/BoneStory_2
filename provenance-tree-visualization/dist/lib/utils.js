"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cam_test = exports.group = exports.preOrderTraversal = exports.copyTree = void 0;
const copyTree = (node) => {
    return Object.assign(Object.assign({}, node), { children: node.children.map(exports.copyTree) });
};
exports.copyTree = copyTree;
const preOrderTraversal = (node, cb) => {
    cb(node);
    node.children.map(child => (0, exports.preOrderTraversal)(child, cb));
};
exports.preOrderTraversal = preOrderTraversal;
const group = (node, test) => {
    let merged = false;
    do {
        merged = false;
        for (const child of node.children) {
            if (test(node, child)) {
                node.children.splice(node.children.indexOf(child), 1);
                node.children.push(...child.children);
                node.wrappedNodes.push(...child.wrappedNodes);
                merged = true;
                break;
            }
        }
    } while (merged);
    node.children.map(child => (0, exports.group)(child, test));
};
exports.group = group;
const cam_test = (label) => {
    const searchpattern = /Camera|View/;
    if (searchpattern.test(label))
        return true;
    else
        return false;
};
exports.cam_test = cam_test;
//# sourceMappingURL=utils.js.map