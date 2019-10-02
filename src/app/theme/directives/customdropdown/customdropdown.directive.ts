import { Directive,HostListener,HostBinding, ElementRef } from '@angular/core'; 
@Directive({
  selector: '[customdropdown]',
  exportAs: 'customdropdown'
})
export class CustomDropdown {

private isOpen: boolean =false;
constructor(private _el: ElementRef) { 

}

@HostBinding('class.show') get opened() {
    return this.isOpen;
}

@HostListener('click', ['$event']) open(event) {
    event.stopPropagation();
    event.preventDefault();

    let eDentroDoMenu = $(event.target).closest('.dropdown-menu').length;
    let eToggle = $(event.target).closest('.dropdown-toggle').length;

    if( eDentroDoMenu && !eToggle ){
        return
    }else{
        if( eToggle ){
            this.isOpen = !this.isOpen;

            if(this.isOpen){
                (this._el.nativeElement.querySelector('.dropdown-menu')) ? this._el.nativeElement.querySelector('.dropdown-menu').classList.add('show') : null
            }
        }else{
            this.isOpen = !this.isOpen;
        }
    }
}

@HostListener('document:click', ['$event.target']) close (targetElement) {
    let inside: boolean = this._el.nativeElement.contains(targetElement);
    if(!inside) {
        this.isOpen = false;
        this._el.nativeElement.querySelector('.dropdown-menu') ? this._el.nativeElement.querySelector('.dropdown-menu').classList.remove('show') : null
    }
}
}