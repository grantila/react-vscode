import { makeComponent } from 'react-tree-reconciler/components'


export type TreeItemLabel = string | {
	label: string;
	highlights?: [ number, number ][ ];
};

export interface TreeItemProps
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

export const { TreeItem } = makeComponent< TreeItemProps >( )( 'TreeItem' );
