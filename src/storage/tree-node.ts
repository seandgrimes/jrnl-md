import {Entry} from './entry';

interface Dictionary {
  [propName: string]: TreeNode;
}

interface JsonEntry {
  json: TreeNode,
  node: TreeNode
};

export class TreeNode {
  private index: Dictionary = {};
  key: string;
  keys: string[] = [];
  value: Entry;

  get children() : TreeNode[] {
    // TODO: Use a generator
    return this.keys.map(key => this.index[key]);
  }

  constructor(key: string = null, value: Entry = null) {
    this.key = key;
    this.value = value;
  }

  addChild(node: TreeNode) {
    if (this.index[node.key]) throw `Index '${node.key}' already exists`;

    this.index[node.key] = node;
    this.keys.push(node.key);
    this.keys.sort();
  }

  createChildUnlessExists(key: string, value: Entry = null) : TreeNode {
    let child = this.findChild(key);
    if (child === null) {
      child = new TreeNode(key, value);
      this.addChild(child);
    }

    return child;
  }

  findChild(key: string) : TreeNode {
    return this.index[key] || null;
  }

  static fromJson(json : string) : TreeNode {
    // This is a fiction, we have no guarantee that the shape of the data is what
    // we expect, we also can't call any TreeNode methods on this either. It does
    // let the compiler catch some errors though
    const deserialized = JSON.parse(json) as TreeNode;

    const root = new TreeNode();
    const stack: JsonEntry[] = [];
    stack.push({json: deserialized, node: root});

    while (stack.length > 0) {
      const {node: parent, json} = stack.pop();

      json.keys.forEach(key => {
        const temp = json.index[key] as TreeNode;
        const child = new TreeNode(temp.key, temp.value);
        parent.addChild(child);
        stack.push({json: temp, node: child});
      });
    }

    return root;
  }
}
