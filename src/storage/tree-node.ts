import {Entry} from './entry';

export class TreeNode {
  private index: Map<string, TreeNode> = new Map<string, TreeNode>();
  key: string;
  keys: string[] = [];
  value: Entry;

  get children() : TreeNode[] {
    // TODO: Use a generator
    return this.keys.map(key => this.index.get(key));
  }

  constructor(key: string, value: Entry) {
    this.key = key;
    this.value = value;
  }

  addChild(node: TreeNode) {
    if (this.index.has(node.key)) throw `Index '${node.key}' already exists`;

    this.index.set(node.key, node);
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
    return this.index.get(key) || null;
  }
}
