import { expired } from "../ticker/ticker";
import { HNode } from "../core/HNode";
import { _console } from "./refCache";
import { isHNode } from "./helpers";
import { EleProps } from "../core/propHandlers";

export const clear = function (hNode: HNode<any>) {

    const { desc, output } = hNode;

    hNode.active = false;

    if (desc) {

        if (desc.clear) {
            try {
                desc.clear.call(hNode, hNode.props, hNode.store!, hNode.context!);
            } catch (err) {
                _console.error(err);
            }
        }

    } else {

        const { ref } = hNode.props as EleProps;
        if (ref) {
            ref();
        }

    }

    const index = expired.indexOf(hNode);
    if (~index) {
        expired.splice(index, 1);
    }

    if (output) {
        output.forEach((child: unknown) => {
            if (isHNode(child)) {
                clear(child);
            }
        });
    }

};
