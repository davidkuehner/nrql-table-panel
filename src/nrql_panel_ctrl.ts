import { MetricsPanelCtrl } from 'grafana/app/plugins/sdk';
import moment from 'moment';
import _ from 'lodash';
import './css/nrql-panel.css';

export class NrqlPanelCtrl extends MetricsPanelCtrl {
  static templateUrl = 'partials/module.html';

  panelDefaults = {
    nrqlSettings: {
      timestampFormat: 'DD-MM-YY HH:mm',
      showNrqlQuery: false,
      convertUrlToLink: true,
      linkText: 'open link'
    }
  };

  dataRaw = [];
  nrqlQuery: string;
  isInsightsQueryType = true;

  /** @ngInject */
  constructor($scope, $injector) {
    super($scope, $injector);
    _.defaultsDeep(this.panel, this.panelDefaults);

    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
    this.events.on('panel-teardown', this.onPanelTeardown.bind(this));
    this.events.on('panel-initialized', this.render.bind(this));
    this.events.on('component-did-mount', this.render.bind(this));

    this.events.on('data-received', this.onDataReceived.bind(this));
    this.events.on('data-error', this.onDataError.bind(this));

  }

  onDataError(err) {
    this.dataRaw = [];
    this.render();
  }

  onDataReceived(dataList) {
    if(dataList
        && dataList[0]
        && dataList[0].target === "events"
        && dataList[0].datapoints
        && dataList[0].datapoints[0]) {
      this.dataRaw = dataList[0].datapoints[0][0];
      this.nrqlQuery = this.panel.targets[0].query;

    } else {
      console.log("Could not parse response", dataList);
      this.dataRaw = [];
      this.nrqlQuery = "";
    }

    this.isInsightsQueryType = dataList[0] && dataList[0].target === "events" && this.panel.targets[0].queryType === "insights";
    // console.log(this.dataRaw);
    // console.log(this.nrqlQuery);
    this.render();
  }

  toReadableTimestamp(timestamp) {
    return moment.unix(timestamp/1000).format(this.panel.nrqlSettings.timestampFormat);
  }

  parseData(data) {
    if(!data || data === "") {
      return "------";
    }
    if(moment.unix(data/1000).isValid()) {
      return moment.unix(data/1000).format(this.panel.nrqlSettings.timestampFormat);
    }
    if(this.panel.nrqlSettings.convertUrlToLink && data.startsWith("http")) {
      return `<a href='${data}' target='_blank'>${this.panel.nrqlSettings.linkText}</a>`;
    }
    return data;
  }

  getDataRawPropertiesNames() {
    if(this.dataRaw && this.dataRaw[0]) {
      return Object.getOwnPropertyNames(this.dataRaw[0])
          .filter(propName => propName !== "$$hashKey")
          .map(propName => propName.replace(/_/g, ' ').toUpperCase());
    }
    return [];
  }

  onInitEditMode() {
    this.addEditorTab('Options', 'public/plugins/nrql-table-panel/partials/options.html', 2);
  }

  onPanelTeardown() {}

  link(scope, elem) {
    this.events.on('render', () => {
      const $panelContainer = elem.find('.panel-container');

      if (this.panel.bgColor) {
        $panelContainer.css('background-color', this.panel.bgColor);
      } else {
        $panelContainer.css('background-color', '');
      }

      const tableScroll = elem.find('.table-panel-scroll')[0];
      let panelHeight = this.height-60;
      tableScroll.setAttribute("style", `max-height:${panelHeight}px;`);
    });
  }

}
