export type Sample = {
    date: string;
    name: string;
    value: string;
};

class Power {
    readonly watts: number;

    private constructor(val_in_watts: number | string) {
        this.watts = Number(val_in_watts);
    }

    renderTokW(): string {
        return (this.watts / 1000.0).toFixed(1);
    }

    static Watt(val_in_watts: number | string) {
        return new Power(val_in_watts);
    }
}

class Energy {
    readonly watt_hour: number;

    private constructor(val_in_watts_hour: number | string) {
        this.watt_hour = Number(val_in_watts_hour);
    }

    renderTokWh(): string {
        return (this.watt_hour / 1000.0).toFixed(1);
    }

    static WattHour(val_in_watts_hour: number | string) {
        return new Energy(val_in_watts_hour);
    }
}

class Teleinfo {
    samples: Sample[];
    zero: Sample[];

    constructor(samples: Sample[], zero: Sample[]) {
        this.samples = samples;
        this.zero = zero;
    }

    getInstantPower(): Power {

        const instant = this.find("power_import_watt");
        if (instant){
            return Power.Watt(getIntValue("power_import_watt", this.samples));
        }

        return Power.Watt(getIntValue("PAPP", this.samples));
    }

    getInstantSolarPower(): Power {
        return Power.Watt(getIntValue("instant_solar_production_watt", this.samples));
    }

    getDailySolarProduction(): Energy {
        return Energy.WattHour(getIntValue("total_solar_production_wh", this.samples));
    }

    getDailyConsumption() {
        return this.getAccuConsumption("BBRHP");
    }

    getNightlyConsumption() {
        return this.getAccuConsumption("BBRHC");
    }

    getSoftSolarState() {
        const state = this.find("soft_solar_router_state");
        if (state){
            return state.value
        }
        return "---"
        
    }

    isRedPeriod() {
        const ptec = this.find("PTEC");
        return ptec && ptec.value.endsWith("JR");
    }

    isWhitePeriod() {
        const ptec = this.find("PTEC");
        return ptec && ptec.value.endsWith("JW");
    }

    isTomorrowRedPeriod() {
        const demain = this.find("DEMAIN");
        if (demain === undefined) {
            return false;
        }
        return demain.value.startsWith("ROUG");
    }

    isTomorrowWhitePeriod() {
        const demain = this.find("DEMAIN");
        if (demain === undefined) {
            return false;
        }
        return demain.value.startsWith("BLAN");
    }

    private getAccuConsumption(key: string) {
        return this.samples
            .filter((sample) => sample.name.startsWith(key))
            .map((sample) => this.getConsumption(sample.name))
            .reduce(
                (prev, current) => Energy.WattHour(prev.watt_hour + current.watt_hour),
                Energy.WattHour(0)
            );
    }

    private getConsumption(key: string) {
        const hp = getIntValue(key, this.samples);
        const hp_offset = getIntValue(key, this.zero);

        return Energy.WattHour(hp - hp_offset);
    }

    private find(name: string): Sample | undefined {
        return this.samples.find((val) => val.name === name);
    }
}


function getIntValue(name: string, vals: Sample[]): number {
    const ret = vals
        .filter((val: Sample) => {
            return val.name === name;
        })
        .map((val: Sample) => {
            return parseInt(val.value);
        });

    if (ret.length)
        return ret.reduce((val: number) => {
            return val;
        });

    return 0;
}


export { Teleinfo, Power, Energy };
