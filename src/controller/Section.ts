export default class Section {
	public readonly dept: string;
	public readonly id: string;
	public readonly instructor: string;
	public readonly title: string;
	public readonly uuid: string;
	public readonly avg: number;
	public readonly pass: number;
	public readonly fail: number;
	public readonly audit: number;
	public readonly year: number;

	constructor(
		dept: string,
		id: string,
		instructor: string,
		title: string,
		uuid: string,
		avg: number,
		pass: number,
		fail: number,
		audit: number,
		year: number
	) {
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
