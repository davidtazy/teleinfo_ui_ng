import { Energy, Power, Sample, Teleinfo } from "./teleinfo";

const samples: Sample[] = [
  {
    date: "2022-11-01T20:57:50Z",
    name: "BBRHCJB",
    value: "12242517",
  },
  {
    date: "2022-11-01T20:57:50Z",
    name: "BBRHCJR",
    value: "000000000",
  },
  {
    date: "2022-11-01T20:57:50Z",
    name: "BBRHCJW",
    value: "000014409",
  },
  {
    date: "2022-11-01T20:57:50Z",
    name: "BBRHPJB",
    value: "18520785",
  },
  {
    date: "2022-11-01T20:57:50Z",
    name: "BBRHPJR",
    value: "000000000",
  },
  {
    date: "2022-11-01T20:57:50Z",
    name: "BBRHPJW",
    value: "000011398",
  },
  {
    date: "2022-11-01T20:57:50Z",
    name: "DEMAIN",
    value: "----",
  },
  {
    date: "2022-11-01T20:57:50Z",
    name: "HHPHC",
    value: "A",
  },
  {
    date: "2022-11-01T20:57:50Z",
    name: "IINST",
    value: "2",
  },
  {
    date: "2022-11-01T20:57:50Z",
    name: "IMAX",
    value: "90",
  },
  {
    date: "2022-11-01T20:57:50Z",
    name: "ISOUSC",
    value: "45",
  },
  {
    date: "2022-11-01T20:57:50Z",
    name: "MOTDETAT",
    value: "000000",
  },
  {
    date: "2022-11-01T20:57:50Z",
    name: "OPTARIF",
    value: "BBR(",
  },
  {
    date: "2022-11-01T20:57:50Z",
    name: "PAPP",
    value: "570",
  },
  {
    date: "2022-11-01T20:57:50Z",
    name: "PTEC",
    value: "HPJB",
  },
];
const zero: Sample[] = [
  {
    date: "2022-11-01T10:57:50Z",
    name: "BBRHPJB",
    value: "18520000",
  },
  {
    date: "2022-11-01T20:57:50Z",
    name: "BBRHPJR",
    value: "000000000",
  },
  {
    date: "2022-11-01T20:57:50Z",
    name: "BBRHPJW",
    value: "000011398",
  },
  {
    date: "2022-11-01T10:57:50Z",
    name: "BBRHCJB",
    value: "12240000",
  },
  {
    date: "2022-11-01T20:57:50Z",
    name: "BBRHCJR",
    value: "000000000",
  },
  {
    date: "2022-11-01T20:57:50Z",
    name: "BBRHCJW",
    value: "000014409",
  },
];


describe('Teleinfo core', () => {

  it("calc instant power", () => {
    const tt = new Teleinfo(samples, zero);

    const pow = tt.getInstantPower();
    expect(pow).toEqual(Power.Watt(570));

    expect(pow.renderTokW()).toEqual("0.6");
  });

  it("calc daily consumtion", () => {
    const tt = new Teleinfo(samples, zero);

    const cons = tt.getDailyConsumption();
    expect(cons).toEqual(Energy.WattHour(785));

    expect(cons.renderTokWh()).toEqual("0.8");
  });

  it("calc instant power when no data", () => {
    const tt = new Teleinfo([], []);

    const pow = tt.getInstantPower();
    expect(pow).toEqual(Power.Watt(0));

    expect(pow.renderTokW()).toEqual("0.0");
  });

  it("calc daily consumtion when no data", () => {
    const tt = new Teleinfo([], []);

    const cons = tt.getDailyConsumption();
    expect(cons).toEqual(Energy.WattHour(0));

    expect(cons.renderTokWh()).toEqual("0.0");
  });

  it("calc nightly consumtion", () => {
    const tt = new Teleinfo(samples, zero);

    const cons = tt.getNightlyConsumption();
    expect(cons).toEqual(Energy.WattHour(2517));

    expect(cons.renderTokWh()).toEqual("2.5");
  });

  it("not red period on Blue period", () => {
    const tt = new Teleinfo(samples, []);

    expect(tt.isRedPeriod()).toBeFalsy();
    expect(tt.isTomorrowRedPeriod()).toBeFalsy();
  });

  it("not red period when no data", () => {
    const tt = new Teleinfo([], []);

    expect(tt.isRedPeriod()).toBeFalsy();
    expect(tt.isTomorrowRedPeriod()).toBeFalsy();
  });

  it("red period on red period", () => {
    const tt = new Teleinfo(
      [
        {
          date: "2022-11-01T20:57:50Z",
          name: "PTEC",
          value: "HPJR",
        },
        {
          date: "2022-11-01T20:57:50Z",
          name: "DEMAIN",
          value: "BLAN",
        },
      ],
      []
    );

    expect(tt.isRedPeriod()).toBeTruthy();
    expect(tt.isTomorrowRedPeriod()).toBeFalsy();

    expect(tt.isWhitePeriod()).toBeFalsy();
    expect(tt.isTomorrowWhitePeriod()).toBeTruthy();

  });

  it("red period on demain", () => {
    const tt = new Teleinfo(
      [
        {
          date: "2022-11-01T20:57:50Z",
          name: "DEMAIN",
          value: "ROUG",
        },
      ],
      []
    );

    expect(tt.isTomorrowRedPeriod()).toBeTruthy();
    expect(tt.isRedPeriod()).toBeFalsy();
  });

  it("white period on demain", () => {
    const tt = new Teleinfo(
      [
        {
          date: "2022-11-01T20:57:50Z",
          name: "DEMAIN",
          value: "BLAN",
        },
      ],
      []
    );

    expect(tt.isTomorrowWhitePeriod()).toBeTruthy();
    expect(tt.isWhitePeriod()).toBeFalsy();
  });

})
