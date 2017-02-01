import React from 'react';
import CustomSlider from '../../../../../../../../components/common/CustomSlider/CustomSlider';
import style from './RuleValue.css';
import ComboBox from '../../../../../../../../components/common/ComboBox/ComboBox';
import editorRulesValuesConverter from '../../../../../../../../services/editor-rules-values-converter';

function replaceNaN(fallbackValue) { return isNaN(this) ? fallbackValue : this; }
const parseNumericInput = (inputValue) => inputValue === '' ? 0 : parseInt(inputValue);

function updateTypedValue(mutate, value, valueType) {
  mutate.updateValue(editorRulesValuesConverter(value, '' + value, valueType).value)
}

let SingleVariantValue = ({ value, mutate, valueType, identities, autofocus }) => (
  (<div className={style['rule-value-container']}>

    <input
      onChange={e => updateTypedValue(mutate, e.target.value, valueType) }
      value={value}
    placeholder="Enter values here"
      className={style['values-input']}
    ref={(e) => e && autofocus && e.focus()}
    />

    {(value === 'true' || value === 'false') ?
      <button className={style['to-feature-flag-button']}
        onClick={() => mutate.apply(m =>
          m.delete()
            .in('Type').updateValue('MultiVariant').up()
            .insert('OwnerType', identities[0])
            .insert('ValueDistribution', {
              type: 'bernoulliTrial',
              args: 0.1,
            })
        )}
        >Gradual release</button>
      :
      <button className={style['add-variant-button']}
        onClick={() => mutate.apply(m =>
          m.delete()
            .in('Type').updateValue('MultiVariant').up()
            .insert('OwnerType', identities[0])
            .insert('ValueDistribution', {
              type: 'weighted',
              args: {
                [value]: 50,
                'New Varaint': 50,
              },
            })
        )}
        >Add Variant</button>}

  </div>)
);

const multiVariantSliderColors = ['#ccf085', '#bebebe', '#c395f6', '#ef7478', '#5a8dc3', '#6e6e6e'];
const WeightedValues = ({ onUpdate, variants }) =>
  (<CustomSlider data={variants}
    onUpdate={onUpdate}
    displaySliderDragger={false}
    sliderColors={multiVariantSliderColors} />);

const bernouliTrialSliderColors = ['#007acc', 'lightGray'];
const BernoulliTrial = ({ onUpdate, ratio }) => (
  <div className={style['bernoulli-trial-container']}>
    <div className={style['bernoulli-trial-input-wrapper']}>
      <label>Open to</label>
      <input type="text"
        className={style['bernoulli-trial-input']}
        value={ratio * 100}
        onChange={e => {
          const newValue = e.target.value;
          if (newValue < 0 ||
            newValue > 100) {
            e.stopPropagation();
            return;
          }
          onUpdate((parseNumericInput(newValue) * 0.01):: replaceNaN(ratio));
        }}
        onWheel={({ deltaY, target }) => {
        const currentValue = parseNumericInput(target.value);
        const newValue = deltaY < 0 ? currentValue + 1 : currentValue - 1;
        if (newValue < 0 || newValue > 100) return;
        onUpdate(newValue * 0.01);
      } }
      />
      <label>%</label>
    </div>
    <div className={style['bernoulli-trial-slider-wrapper']}>
      <CustomSlider displayLegend={false}
        sliderColors={bernouliTrialSliderColors}
        data={{ true: 1000 * ratio / 10, false: 100 - (1000 * ratio / 10) }}
        onUpdate={x => onUpdate(x.true / 100)}
        />
    </div>
  </div>
);

const IdetitySelection = ({ identities, mutate }) => {
  return (
    <div>
      <label className={style['identity-selection-title']}>Identity: </label>
      <div className={style['identity-selection-combobox-wrapper']}>
        <ComboBox
          options={identities}
          onChange={(selectedValues) => mutate.in('OwnerType').updateValue(selectedValues.value)}
          defaultSelected={[identities[0]]}
          />
      </div>
    </div>
  );
};

const MultiVariantValue = ({ valueDistrubtion: { type, args }, mutate, identities }) => {
  if (type === 'weighted')
    return (
      <div>
        <IdetitySelection identities={identities} mutate={mutate} />
        <WeightedValues variants={args}
          onUpdate={variants => {
            if (Object.keys(variants).length !== 1) {
              mutate.in('args').updateValue(variants);
              return;
            }

            const newValue = Object.keys(variants)[0];
            mutate.apply(m => m.up()
              .in('Value').updateValue(newValue).up()
              .in('Type').updateValue('SingleVariant').up()
              .in('ValueDistribution').delete()
              .in('OwnerType').delete());
          } }
          />
      </div>
    );
  if (type === 'bernoulliTrial') {
    return (
      <div>
        <IdetitySelection identities={identities} mutate={mutate} />

        <div style={{ marginTop: 5 }}>
          <BernoulliTrial onUpdate={mutate.in('args').updateValue}
            ratio={args}
            />

          {(args === 1) ?
            <button className={style['set-to-true-button']}
              onClick={() => mutate.apply(m =>
                m.up()
                  .in('Value').updateValue('true').up()
                  .in('Type').updateValue('SingleVariant').up()
                  .in('ValueDistribution').delete()
                  .in('OwnerType').delete()
              )}
              >Set to true
            </button> : null}

          {(args === 0) ?
            <button className={style['set-to-false-button']}
              onClick={() => mutate.apply(m =>
                  m.up()
                    .in('Value').updateValue('false').up()
                    .in('Type').updateValue('SingleVariant').up()
                    .in('ValueDistribution').delete()
                    .in('OwnerType').delete()
                )}
              >Set to false
            </button> : null}

        </div>

      </div>
    );
  }
  return null;
};

export default ({ rule, mutate, valueType, autofocus, schema }) => {
  const identities = Object.keys(schema);

  if (rule.Type === 'SingleVariant')
    return (<SingleVariantValue mutate={mutate.in('Value')}
      value={rule.Value}
      {...{ identities, autofocus, valueType }}
      />);

  if (rule.Type === 'MultiVariant')
    return (<MultiVariantValue mutate={mutate.in('ValueDistribution')}
      valueDistrubtion={rule.ValueDistribution}
      {...{ identities, valueType }}
      />);

  return null;
};
