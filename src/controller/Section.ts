export default class Section {
    readonly dept: string;
    readonly id: string;
    readonly instructor: string;
    readonly title: string;
    readonly uuid: string;
    readonly avg: number;
    readonly pass: number;
    readonly fail: number;
    readonly audit: number;
    readonly year: number;

// TODO: add insightdataset list in insightfacade (to hold id's)
//       add single dataset + sections to be held in memory
    constructor(dept: string, id: string, instructor: string, title: string, uuid: string,
        avg: number, pass: number, fail: number, audit: number, year: number) {
        this.dept = dept;
        this.id = id;
        this.instructor = instructor;
        this.title = title;
        this.uuid = uuid;
        this.avg = avg;
        this.pass = pass;
        this.fail = fail;
        this.audit = audit;
        this.year = year;
      }
}
