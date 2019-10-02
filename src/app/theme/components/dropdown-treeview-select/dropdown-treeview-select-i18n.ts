import { TreeviewItem, TreeviewSelection, TreeviewI18nDefault } from 'ngx-treeview';

export class DropdownTreeviewSelectI18n extends TreeviewI18nDefault {
    private internalSelectedItem: TreeviewItem;

    set selectedItem(value: TreeviewItem) {
        if (value && value.children === undefined) {
            this.internalSelectedItem = value;
        }
    }

    get selectedItem(): TreeviewItem {
        return this.internalSelectedItem;
    }

    getText(selection: TreeviewSelection): string {

        if ( this.internalSelectedItem.value == undefined ) {
            return 'Mostrar Todos';
        }        
        return this.internalSelectedItem.text;
    }

    getAllCheckboxText(): string {
        return 'Mostrar Todos'
    }

    getFilterPlaceholder(): string {
        return 'Filtrar'
    }

    getFilterNoItemsFoundText(): string {
        return 'Sem resultados'
    }

    getTooltipCollapseExpandText(isCollapse: boolean): string {
        return isCollapse
            ? 'Expandir'
            : 'Diminuir';
    }
}
