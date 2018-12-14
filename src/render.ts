import { toNode } from "./HNode";
import { _isArray, _document } from "./refCache";
import { Store, createStore } from "./Store";
import { toFrag, toArr } from "./utils";

export const render = function (src: any, parent: Node = _document.body, clear?: boolean, global?: Store) {

    if (clear) {
        parent.childNodes.forEach(childNode => {
            parent.removeChild(childNode);
        });
    }

    parent.appendChild(
        toFrag(
            toArr(
                toNode(src, global || createStore(), parent)
            )
        )
    );

};
