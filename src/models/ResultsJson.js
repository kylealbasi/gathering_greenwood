import utils from "../utils/utils.js";
import { Status, DetailedResponse } from "../utils/DetailedResponse.js";

const centuryPrefixes = ["18", "19", "20", "21", "22", "23"];

class ResultsJson {
  constructor(params) {
    this.buildings = params.buildings;
    this.people = params.people;
    this.census_records = params.census_records;
    this.documents = params.documents;
    this.stories = params.stories;
    this.media = params.media;
    this.count = params.count;
  }

  static fromJson(callback, obj) {
    if (typeof callback !== "function") {
      throw new Error("Callback must be a function");
    }

    if (!obj || !obj.results || !obj.count) {
      const response = new DetailedResponse(ResultsJson.createEmpty(), "No Results Found", Status.Success, null, false);
      callback(response);
      return;
    }

    if (
      !obj || !(typeof obj.results === "object" && Object.keys(obj.results).length > 0)
    ) {
      const response = new DetailedResponse(null, null, Status.Error, new Error("Invalid results format"), true);
      callback(response);
      return;
    }

    if (!obj || !(typeof obj.count === "object" && Object.keys(obj.count).length > 0)) {
      const response = new DetailedResponse(null, null, Status.Error, new Error("Invalid count format"), true);
      callback(response);
      return;
    }

    let FinalResultsJson = ResultsJson.createEmpty();

    const newObj = obj;
    const results = newObj.results;
    const tempJson = ResultsJson.createEmpty();

    tempJson.buildings = results.buildings;
    tempJson.people = results.people;
    tempJson.census_records = results.documents.filter((item) => item.category === "Census Records");
    tempJson.documents = results.documents.filter((item) => item.category !== "Census Records");
    tempJson.media = results.media;
    tempJson.stories = results.stories;

    const count = [];

    newObj.count
      .filter((c) => c.year !== "Total")
      .forEach((yearCount) => {
        count.push(new Count({ ...yearCount, totalFlag: false }));
      });

    // newObj.count
    //   .filter((year) => Object.keys(year)[0] === "Total")
    //   .forEach((yearCount) => {
    //     count.push(new Count({ ...yearCount, totalFlag: true }));
    //   });

    FinalResultsJson = new ResultsJson({
      buildings: tempJson.buildings,
      people: tempJson.people,
      census_records: tempJson.census_records,
      documents: tempJson.documents,
      media: tempJson.media,
      stories: tempJson.stories,
      count
    });

    const response = new DetailedResponse(FinalResultsJson, "Success", Status.Success, null, false);
    callback(response);
  }

  static createEmpty() {
    return new ResultsJson({
      buildings: [],
      people: [],
      census_records: [],
      documents: [],
      media: [],
      stories: [],
      count: []
    });
  }

  filterByYear(year) {
    if (!year || typeof year !== "string") {
      throw new Error("Invalid year");
    }

    const yearInt = Number.parseInt(year);
    console.log('🔍 ResultsJson.filterByYear:', {
      yearString: year,
      yearInt: yearInt,
      buildingsBeforeFilter: this.buildings.length,
      buildingYears: [...new Set(this.buildings.map(b => b.year))]
    });

    const filtered = new ResultsJson({
      buildings: this.buildings.filter((b) => b.year === yearInt),
      people: this.people.filter((p) => p.year === yearInt),
      census_records: this.census_records.filter((r) => r.year === yearInt),
      documents: this.documents.filter((d) => d.year === yearInt),
      media: this.media.filter((m) => m.year === yearInt),
      stories: this.stories.filter((s) => s.year === yearInt),
      count: this.count.filter((c) => c.year === yearInt)
    });

    console.log('  Filtered buildings:', filtered.buildings.length);
    return filtered;
  }

  TotalCount() {
    if (!this.count || this.count.length === 0) {
      return null;
    }

    const totalCount = new Count();

    this.count.forEach((count) => {
      totalCount.buildings += count.buildings;
      totalCount.people += count.people;
      totalCount.census_records += count.census_records;
      totalCount.documents += count.documents;
      totalCount.media += count.media;
      totalCount.stories += count.stories;
    });

    totalCount.totalFlag = true;
    return totalCount;
  }

  isEmpty() {
    return (
      this.buildings.length === 0 &&
      this.people.length === 0 &&
      this.census_records.length === 0 &&
      this.documents.length === 0 &&
      this.media.length === 0 &&
      this.stories.length === 0 &&
      this.count.length === 0
    );
  }

  static isResultsJson(obj) {
    return (
      obj &&
      Array.isArray(obj.buildings) &&
      Array.isArray(obj.people) &&
      Array.isArray(obj.census_records) &&
      Array.isArray(obj.documents) &&
      Array.isArray(obj.media) &&
      Array.isArray(obj.stories) &&
      Array.isArray(obj.count) &&
      obj.count.every((count) => Count.isCount(count))
    );
  }
}

class Count {
  constructor(params = {}) {
    this.buildings = params.buildings || 0;
    this.people = params.people || 0;
    this.census_records = params.census_records || 0;
    this.documents = params.documents || 0;
    this.media = params.media || 0;
    this.stories = params.stories || 0;
    this.year = params.year || undefined;
    this.totalFlag = params.totalFlag || false;
  }

  get total() {
    return (
      this.buildings +
      this.people +
      this.census_records +
      this.documents +
      this.media +
      this.stories
    );
  }

  static JSONToCount(jsonCount, year) {
    return new Count({
      buildings: jsonCount.buildings,
      people: jsonCount.people,
      census_records: jsonCount.census_records,
      documents: jsonCount.documents,
      media: jsonCount.media,
      stories: jsonCount.stories,
      year
    });
  }

  static isCount(obj) {
    return (
      obj &&
      typeof obj.buildings === "number" &&
      typeof obj.people === "number" &&
      typeof obj.census_records === "number" &&
      typeof obj.documents === "number" &&
      typeof obj.media === "number" &&
      typeof obj.stories === "number" &&
      (obj.year === undefined || typeof obj.year === "string")
    );
  }
}

export { ResultsJson, Count };
export default ResultsJson;
