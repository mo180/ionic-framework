import { Component, ComponentInterface, Element, Event, EventEmitter, Host, Listen, Method, Prop, Watch, h } from '@stencil/core';

import { getIonMode } from '../../global/ionic-global';
import { AccordionGroupChangeEventDetail } from '../../interface';

/**
 * @virtualProp {"ios" | "md"} mode - The mode determines which platform styles to use.
 */
@Component({
  tag: 'ion-accordion-group',
  styleUrls: {
    ios: 'accordion-group.ios.scss',
    md: 'accordion-group.md.scss'
  },
  shadow: true
})
export class AccordionGroup implements ComponentInterface {
  @Element() el!: HTMLIonAccordionGroupElement;

  /**
   * If `true`, the accordion group can have multiple
   * accordion components expanded at the same time.
   */
  @Prop() multiple?: boolean;

  /**
   * The value of the accordion group.
   */
  @Prop({ mutable: true }) value?: string | string[] | null;

  /**
   * If `true`, the accordion group cannot be interacted with.
   */
  @Prop() disabled = false;

  /**
   * If `true`, the accordion group cannot be interacted with,
   * but does not alter the opacity.
   */
  @Prop() readonly = false;

  /**
   * Describes the expansion behavior for each accordion.
   * Possible values are `"accordion"` and `"inset"`.
   * Defaults to `"accordion"`.
   */
  @Prop() expand: 'accordion' | 'inset' = 'accordion';

  /**
   * Emitted when the value property has changed.
   */
  @Event() ionChange!: EventEmitter<AccordionGroupChangeEventDetail>;

  @Watch('value')
  valueChanged() {
    this.ionChange.emit({ value: this.value });
  }

  @Watch('disabled')
  async disabledChanged() {
    const { disabled } = this;
    const accordions = await this.getAccordions();
    for (const accordion of accordions) {
      accordion.disabled = disabled;
    }
  }

  @Watch('readonly')
  async readonlyChanged() {
    const { readonly } = this;
    const accordions = await this.getAccordions();
    for (const accordion of accordions) {
      accordion.readonly = readonly;
    }
  }

  @Listen('keydown')
  async onKeydown(ev: KeyboardEvent) {
    const activeElement = document.activeElement;
    if (!activeElement) { return; }

    const accordionEl = (activeElement.tagName === 'ION-ACCORDION') ? activeElement : activeElement.closest('ion-accordion');
    if (!accordionEl) { return; }

    const closestGroup = accordionEl.closest('ion-accordion-group');
    if (closestGroup !== this.el) { return; }

    // If the active accordion is not in the current array of accordions, do not do anything
    const accordions = await this.getAccordions();
    const startingIndex = accordions.findIndex(a => a === accordionEl);
    if (startingIndex === -1) { return; }

    let accordion: HTMLIonAccordionElement | undefined;
    if (ev.key === 'ArrowDown') {
      accordion = this.findNextAccordion(accordions, startingIndex);
    } else if (ev.key === 'ArrowUp') {
      accordion = this.findPreviousAccordion(accordions, startingIndex);
    }

    if (accordion !== undefined && accordion !== activeElement) {
      accordion.focus();
    }
  }

  async componentDidLoad() {
    if (this.disabled) {
      this.disabledChanged();
    }
    if (this.readonly) {
      this.readonlyChanged();
    }
  }

  /**
   * @internal
   */
  @Method()
  async requestAccordionToggle(accordionValue: string | undefined, accordionExpand: boolean) {
    const { multiple, value, readonly, disabled } = this;
    if (readonly || disabled) { return; }

    if (accordionExpand) {
      /**
       * If group accepts multiple values
       * check to see if value is already in
       * in values array. If not, add it
       * to the array.
       */
      if (multiple) {
        const groupValue = (value || []) as string[];
        const valueExists = groupValue.find(v => v === accordionValue);
        if (valueExists === undefined && accordionValue !== undefined) {
          this.value = [...groupValue, accordionValue];
        }
      /**
       * If group does not accept multiple
       * values, just set the value.
       */
      } else {
        this.value = accordionValue;
      }
    } else {
      /**
       * If collapsing accordion, either filter the value
       * out of the values array or unset the value.
       */
      if (multiple) {
        const groupValue = (value || []) as string[];
        this.value = groupValue.filter(v => v !== accordionValue);
      } else {
        this.value = undefined;
      }
    }
  }

  private findNextAccordion(accordions: HTMLIonAccordionElement[], startingIndex: number) {
    const nextAccordion = accordions[startingIndex + 1];
    // tslint:disable-next-line:strict-type-predicates
    if (nextAccordion === undefined) {
      return accordions[0];
    }

    return nextAccordion;
  }

  private findPreviousAccordion(accordions: HTMLIonAccordionElement[], startingIndex: number) {
    const prevAccordion = accordions[startingIndex - 1];
    // tslint:disable-next-line:strict-type-predicates
    if (prevAccordion === undefined) {
      return accordions[accordions.length - 1];
    }

    return prevAccordion;
  }

  /**
   * @internal
   */
  @Method()
  async getAccordions() {
    return Array.from(this.el.querySelectorAll('ion-accordion'));
  }

  render() {
    const { disabled, readonly, expand } = this;
    const mode = getIonMode(this);

    return (
      <Host
        class={{
          [mode]: true,
          'accordion-group-disabled': disabled,
          'accordion-group-readonly': readonly,
          [`accordion-group-expand-${expand}`]: true
        }}
        role="presentation"
      >
        <slot></slot>
      </Host>
    );
  }
}