[![npm version][npm-image]][npm-url]
[![downloads][downloads-image]][npm-url]
[![build status][build-image]][build-url]
<!-- [![coverage status][coverage-image]][coverage-url] -->
[![Language grade: JavaScript][lgtm-image]][lgtm-url]
[![Node.JS version][node-version]][node-url]

<img src="./assets/logo.svg" width="100%" />

This package allows you to write [TreeViews](https://code.visualstudio.com/api/extension-guides/tree-view) in React.


# API

Use the exported component `TreeItem` (with props `TreeItemProps`) to build a react tree view tree:

```ts
import { TreeItem } from 'react-vscode'

export function MyTree( ) {
   return (
      <TreeItem label="first top-level" initiallyExpanded>
         <SomeThings />
      </TreeItem>
   );
}

function SomeThings( ) {
   return [ "a", "b", "c" ].map( label =>
      <TreeItem
         label={ label }
         onClick={ ( ) => console.log( `Clicked ${label}` ); }
         />
   );
}
```

The `TreeItemProps` are defined as:

```ts
interface TreeItemProps
{
	label: TreeItemLabel;
	description?: string;
	iconUri?: string | { light: string; dark: string };
	tooltip?: string | /*MarkdownString |*/ undefined;
	initiallyExpanded?: boolean;
	onClick?: ( ) => void;
	onSelected?: ( ) => void;
	onExpandState?: ( expanded: boolean ) => void;
}

type TreeItemLabel = string | {
	label: string;
	highlights?: [ number, number ][ ];
};
```

## Use in VSCode

You need to have a tree registered with an id in `package.json`, in e.g. `contributes/views/explorer`.

With a tree id, use `getTree` to create a tree view from a react component. The returned object contains a `disposable` which should be handled, e.g. `context.subscriptions.push( disposable );`

```ts
import { getTree } from 'react-vscode'

// MyTree as defined above

const { disposable } =
   getTree( "my-tree-id", MyTree, { showCollapseAll: true } );
```

The third optional options object is the same as the one to [`createTreeView`](https://code.visualstudio.com/api/references/vscode-api#window.createTreeView)

The returned object is on the form:

```ts
interface TreeResult
{
	treeView: vscode.TreeView;
	treeDataProvider: vscode.TreeDataProvider;
	disposable: vscode.Disposable;
}
```


[npm-image]: https://img.shields.io/npm/v/react-vscode.svg
[npm-url]: https://npmjs.org/package/react-vscode
[downloads-image]: https://img.shields.io/npm/dm/react-vscode.svg
[build-image]: https://img.shields.io/github/workflow/status/grantila/react-vscode/Master.svg
[build-url]: https://github.com/grantila/react-vscode/actions?query=workflow%3AMaster
[coverage-image]: https://coveralls.io/repos/github/grantila/react-vscode/badge.svg?branch=master
[coverage-url]: https://coveralls.io/github/grantila/react-vscode?branch=master
[lgtm-image]: https://img.shields.io/lgtm/grade/javascript/g/grantila/react-vscode.svg?logo=lgtm&logoWidth=18
[lgtm-url]: https://lgtm.com/projects/g/grantila/react-vscode/context:javascript
[node-version]: https://img.shields.io/node/v/react-vscode
[node-url]: https://nodejs.org/en/
