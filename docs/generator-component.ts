import * as uuid from 'uuid/v4';

class GeneratorComponent extends HTMLElement
{

    private _button : HTMLButtonElement;
    private _display : HTMLElement;
    
    constructor()
    {
        super();
        console.log('Generator component instantiated');
        this._button = this.querySelector('button');
        this._display = this.querySelector('uid-display');
    }

    private handleClickEvent:EventListener = this.generate.bind(this);

    connectedCallback()
    {
        this._button.addEventListener('click', this.handleClickEvent);
    }

    private generate() : void
    {
        this._display.innerText = uuid();
    }
}

customElements.define('generator-component', GeneratorComponent);
