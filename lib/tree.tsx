import * as vscode from 'vscode'
import {
	setupElements,
	setupReconciler,
	ReactTreeNode,
	ContainerNode,
} from 'react-tree-reconciler'

import { TreeItemProps, TreeItem } from './components'


interface TreeContext
{
	treeId: string;
	refresh( item: TreeItemImpl ): void;
}

interface TreeItemOptions
{
	id?: vscode.TreeItem[ 'id' ];
	iconPath?: vscode.TreeItem[ 'iconPath' ];
	description?: vscode.TreeItem[ 'description' ];
	resourceUri?: vscode.TreeItem[ 'resourceUri' ];
	tooltip?: vscode.TreeItem[ 'tooltip' ];
	command?: vscode.TreeItem[ 'command' ];
	collapsibleState?: vscode.TreeItem[ 'collapsibleState' ];
	contextValue?: vscode.TreeItem[ 'contextValue' ];
	accessibilityInformation?: vscode.TreeItem[ 'accessibilityInformation' ];
}

class VSCodeTreeItem extends vscode.TreeItem
{
	constructor( label: string | vscode.TreeItemLabel, opts: TreeItemOptions )
	{
		super( label );

		Object.entries( opts ).forEach( ( [ key, val ] ) =>
		{
			if ( val != null )
			{
				this[ key as keyof this ] = val;
			}
		} );
	}
}


class TreeItemImpl extends ReactTreeNode< TreeItemProps, TreeContext >
{
	public treeItem: VSCodeTreeItem;

	static make( type: string, props: TreeItemProps, context: TreeContext )
	{
		return new TreeItemImpl( type, props, context );
	}

	constructor( type: string, props: TreeItemProps, context: TreeContext )
	{
		super( type, props, context );

		this.treeItem = this.#remakeTreeItem( );
	}

	getChildren( )
	{
		return this.children
			.filter( ( item ): item is TreeItemImpl =>
				item instanceof TreeItemImpl
			);
	}

	#remakeTreeItem( ): VSCodeTreeItem
	{
		const id = ( this.props as any )?.key;

		const iconPath: TreeItemOptions[ 'iconPath' ] =
			!this.props.iconUri
			? undefined
			: typeof this.props.iconUri === 'string'
			? vscode.Uri.parse( this.props.iconUri, true )
			: {
				dark: vscode.Uri.parse( this.props.iconUri.dark, true ),
				light: vscode.Uri.parse( this.props.iconUri.light, true ),
			};

		return new VSCodeTreeItem(
			this.props.label,
			{
				description: this.props.description,
				collapsibleState:
					this.getChildren( ).length === 0
					? 0
					: this.props.initiallyExpanded
					? 2
					: 1,
				tooltip:
					!this.props.tooltip
					? undefined
					: new vscode.MarkdownString( this.props.tooltip ),
				command: {
					command: `${this.context.treeId}.itemClick`,
					arguments: [ this ],
				},
				...iconPath,
				...( id && { id } ),
			}
		);
	}

	#resetTreeItem( )
	{
		this.treeItem = this.#remakeTreeItem( );
		this.context.refresh( this );
	}

	onChildrenChanged( )
	{
		this.#resetTreeItem( );
	}

	onFinalizeChildren( )
	{
		this.#resetTreeItem( );
	}

	onPropsChanged( )
	{
		this.#resetTreeItem( );
	}
}

class ContainerImpl
	extends TreeItemImpl
	implements ContainerNode< TreeContext >
{
	doClear( )
	{
		this.clear( );
	}
}


export interface TreeResult
{
	treeView: vscode.TreeView< TreeItemImpl >;
	treeDataProvider: vscode.TreeDataProvider< unknown >;
	disposable: vscode.Disposable;
}

export function getTree(
	treeId: string,
	root: JSX.Element,
	options?: Omit< vscode.TreeViewOptions< any >, 'treeDataProvider' >
)
: TreeResult
{
	class TreeDataProvider implements vscode.TreeDataProvider< TreeItemImpl >
	{
		#onDidChangeTreeData =
			new vscode.EventEmitter< TreeItemImpl | undefined | null | void >( );
		readonly onDidChangeTreeData = this.#onDidChangeTreeData.event;

		constructor( private root: TreeItemImpl )
		{ }

		refresh( treeItem?: TreeItemImpl | undefined )
		{
			this.#onDidChangeTreeData.fire( treeItem );
		}

		getTreeItem( element: TreeItemImpl )
		{
			return element.treeItem;
		}

		getChildren( element?: TreeItemImpl )
		{
			if ( !element )
			{
				return this.root.getChildren( );
			}
			else
			{
				return element.getChildren( );
			}
		}
	}

	const context: TreeContext = {
		treeId,
		refresh: ( ) => { },
	};

	const elementSetup = setupElements( {
		elements: [
			[ TreeItem, TreeItemImpl.make ],
		],
		context,
	} );

	const rootContainer =
		new ContainerImpl( 'root', { label: 'root' }, context );

	const { render } = setupReconciler( root, {
		elementSetup,
		rootContainer,
	} );

	const treeDataProvider = new TreeDataProvider( rootContainer );

	render( );

	context.refresh = treeItem =>
	{
		treeDataProvider.refresh( treeItem );
	};

	const treeView = vscode.window.createTreeView(
		treeId,
		{
			...options,
			treeDataProvider,
		}
	);

	const disposable = connectEvents( treeId, treeView );

	return { treeView, treeDataProvider, disposable };
}

function connectEvents( treeId: string, tree: vscode.TreeView< TreeItemImpl > )
{
	tree.onDidChangeSelection( ( { selection } ) =>
	{
		selection.forEach( element => element.props.onSelected?.( ) );
	} );

	tree.onDidCollapseElement( ( { element } ) =>
	{
		element.props.onExpandState?.( false );
	} );
	tree.onDidExpandElement( ( { element } ) =>
	{
		element.props.onExpandState?.( true );
	} );

	return vscode.commands.registerCommand(
		`${treeId}.itemClick`,
		item =>
		{
			if ( item instanceof TreeItemImpl )
			{
				item.props.onSelected?.( );
			}
		}
	);
}
