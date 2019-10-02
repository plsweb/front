import {Component,ElementRef, EventEmitter, forwardRef, Input, OnInit, OnChanges, Output, NgModule, Renderer2} from '@angular/core';
import {ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR} from '@angular/forms';
import * as noUiSlider from 'nouislider';

export interface NouiFormatter {
    to(value: number): string;
    from(value: string): number;
}

export class DefaultFormatter implements NouiFormatter {
    to(value: number): string {
        return String(parseFloat(parseFloat(String(value)).toFixed(2)));
    };
    from(value: string): number {
        return parseFloat(value);
    }
}

@Component({
    selector: 'nouislider',
    host: {'[class.ng2-nouislider]': 'true'},
    template: `<div class="container-fluid" style="padding-left: 0px;" [attr.disabled]="disabled ? true : undefined"></div>
                <label id="slider-span" *ngIf="label"></label>`,
    styleUrls: ['./ng2-nouislider.scss'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => NouisliderComponent),
        multi: true
    }]
})
export class NouisliderComponent implements ControlValueAccessor, OnInit, OnChanges {
    public slider: any;
    public handles: any[];
    @Input() public config;
    @Input() public disabled: boolean;
    @Input() public behaviour: string;
    @Input() public connect: boolean[];
    @Input() public limit: number;
    @Input() public min: number;
    @Input() public max: number;
    @Input() public snap: boolean;
    @Input() public animate: boolean | boolean[];
    @Input() public range: any;
    @Input() public step: number;
    @Input() public format: NouiFormatter;
    @Input() public pageSteps: number;
    @Input() public ngModel: number | number[];
    @Input() public keyboard: boolean;
    @Input() public onKeydown: any;
    @Input() public formControl: FormControl;
    @Input() public tooltips: Array<any>;
    @Input() public label = false;
    @Output() public change: EventEmitter<any> = new EventEmitter(true);
    @Output() public update: EventEmitter<any> = new EventEmitter(true);
    @Output() public slide: EventEmitter<any> = new EventEmitter(true);
    @Output() public set: EventEmitter<any> = new EventEmitter(true);
    @Output() public start: EventEmitter<any> = new EventEmitter(true);
    @Output() public end: EventEmitter<any> = new EventEmitter(true);
    private value: any;
    private onChange: any = Function.prototype;
    private onTouched: any = Function.prototype;

    constructor(private el: ElementRef, private renderer: Renderer2) { }

    ngOnInit(): void {
        if((!!this.config) == false) {
            this.config = (!!this.config);
        }

        switch (this.config) {
            case 'someKeyboardConfig':
                this.config = this.someKeyboardConfig;
            break;
            case 'porcentagem':
                this.config = this.porcentagem;
            case false:
                this.config = this.customConfig;
            break;
            default:
                this.config = this.config
            break;
        }

        let inputsConfig = JSON.parse(
            JSON.stringify({
                behaviour: this.behaviour,
                connect: this.connect,
                limit: this.limit,
                start: this.formControl !== undefined ? this.formControl.value : this.ngModel,
                step: this.step,
                pageSteps: this.pageSteps,
                keyboard: this.keyboard,
                onKeydown: this.onKeydown,
                range: this.range || this.config.range || {min: this.min, max: this.max},
                tooltips: this.tooltips,
                snap: this.snap,
                animate: this.animate
            })
        );

        inputsConfig.tooltips = this.tooltips || this.config.tooltips;
        inputsConfig.format = this.format || this.config.format || new DefaultFormatter();

        this.slider = noUiSlider.create(
            this.el.nativeElement.querySelector('div'),
            Object.assign(this.config, inputsConfig)
        );
        
        this.handles = [].slice.call(this.el.nativeElement.querySelectorAll('.noUi-handle'));

        if(this.config.keyboard) {
            if(this.config.pageSteps === undefined) {
                this.config.pageSteps = 10;
            }

            for(let handle of this.handles) {
                handle.setAttribute('tabindex', 0);
                handle.addEventListener('click', () => {
                    handle.focus();
                });
                if(this.config.onKeydown === undefined) {
                    handle.addEventListener('keydown', this.defaultKeyHandler);
                } else {
                    handle.addEventListener('keydown', this.config.onKeydown);
                }
            }
        }

        this.slider.on('set', (values: string[], handle: number, unencoded: number[]) => {
            this.eventHandler(this.set, values, handle, unencoded);
        });

        this.slider.on('update', (values: string[], handle: number, unencoded: number[]) => {
            this.update.emit(this.toValues(values));
            if (document.getElementById('slider-span')) {
                document.getElementById('slider-span').innerHTML = parseFloat(String(((this.toValues(values) / this.config.range.max) * 100))).toFixed(2) + '%';
            }
        });

        this.slider.on('change', (values: string[], handle: number, unencoded: number[]) => {
            this.change.emit(this.toValues(values));
        });

        this.slider.on('slide', (values: string[], handle: number, unencoded: number[]) => {
            this.eventHandler(this.slide, values, handle, unencoded);
        });

        this.slider.on('start', (values: string[], handle: number, unencoded: number[]) => {
            this.start.emit(this.toValues(values));
        });

        this.slider.on('end', (values: string[], handle: number, unencoded: number[]) => {
            this.end.emit(this.toValues(values));
        });
    }

    ngOnChanges(changes: any) {
        if (this.slider && (changes.min || changes.max || changes.step || changes.range)) {
            setTimeout(() => {
                this.slider.updateOptions({
                    range: Object.assign({}, {
                        min: this.min,
                        max: this.max
                    }, this.range || {}),
                    step: this.step
                });
            });
        }
    }

    toValues(values: string[]): any | any[] {
        let v = values.map(this.config.format.from);
        return (v.length == 1 ? v[0] : v);
    }

    writeValue(value: any): void {
        if (this.slider) {
            setTimeout(() => {
                this.slider.set(value);
            });
        }
    }

    registerOnChange(fn: (value: any) => void) {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => {}): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        isDisabled
            ? this.renderer.setAttribute(this.el.nativeElement.childNodes[0], 'disabled', 'true')
            : this.renderer.removeAttribute(this.el.nativeElement.childNodes[0], 'disabled');
    }

    private eventHandler = (emitter: EventEmitter<any>, values: string[], handle: number, unencoded: number[]) => {
        let v = this.toValues(values);
        let emitEvents = false;
        if(this.value === undefined) {
            this.value = v;
            return;
        }
        if(Array.isArray(v) && this.value[handle] != v[handle]) {
            emitEvents = true;
        }
        if(!Array.isArray(v) && this.value != v) {
            emitEvents = true;
        }
        if(emitEvents) {
            emitter.emit(v);
            this.onChange(v);
        }
        if(Array.isArray(v)) {
            this.value[handle] = v[handle];
        } else {
            this.value = v;
        }
    }

    private defaultKeyHandler = (e: KeyboardEvent) => {
        let stepSize: any[] = this.slider.steps();
        let index = parseInt((<HTMLElement>e.target).getAttribute('data-handle'));
        let sign = 1;
        let multiplier: number = 1;
        let step = 0;
        let delta = 0;

        switch ( e.which ) {
            case 34:  // PageDown
                multiplier = this.config.pageSteps;
            case 40:  // ArrowDown
            case 37:  // ArrowLeft
                sign = -1;
                step = stepSize[index][0];
                e.preventDefault();
            break;

            case 33:  // PageUp
                multiplier = this.config.pageSteps;
            case 38:  // ArrowUp
            case 39:  // ArrowRight
                step = stepSize[index][1];
                e.preventDefault();
            break;

            default:
            break;
        }

        delta = sign * multiplier * step;
        let newValue: number | number[];

        if(Array.isArray(this.value)) {
            newValue = [].concat(this.value);
            newValue[index] = newValue[index] + delta;
        } else {
            newValue = this.value + delta;
        }

        this.slider.set(newValue);
    }

    public someKeyboardConfig: any = {
        behaviour: 'drag',
        connect: true,
        start: [0, 5],
        keyboard: true,
        step: 0.1,
        pageSteps: 10,  // number of page steps, defaults to 10
        range: {
            min: 0,
            max: 5
        },
        pips: {
            mode: 'count',
            density: 2,
            values: 6,
            stepped: true
        }
    };

    //;;;;;;;;;;;;;; Configuração Personalizada ;;;;;;;;;;;;;;//


    // Horas //
    private customConfig: any = {
        connect: true,
        start: [1, 82800],
        range: {
            min: 1,
            max: 82800
        },
        step: 3600,
        format: {
            to(value) {
                value = Math.trunc(value);
                let h = Math.floor(value / 3600);
                let m = Math.floor(value % 3600 / 60);
                let s = value - 60 * m - 3600 * h;
                let values = [h, m];
                let timeString: string = '';
                values.forEach((_, i) => {
                    if(values[i] < 10) {
                        timeString += '0';
                    }
                    timeString += values[i].toFixed(0);
                    if(i < 1) {
                        timeString += ':';
                    }
                });
                return timeString;
            },
            from(value) {
                return value;
            }
        }
    };

    // Porcentagem //
    private porcentagem = {
        animate: this.animate,
        start: this.formControl !== undefined ? this.formControl.value : this.ngModel,
        connect: this.connect,
        range: {min: this.min, max: this.max}
    };
}

// @NgModule({
//     imports: [],
//     exports: [NouisliderComponent],
//     declarations: [NouisliderComponent],
// })

// export class NouisliderModule {}