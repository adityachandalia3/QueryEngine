export interface Query {
	where: Filter;
	options: {
		columns: string[]; // check later at least one
		order?: Mkey | Skey; // check later order is in column
	};
}

export interface Filter {
	and: Filter[];
	or: Filter[];
	lt: Mkey;
	gt: Mkey;
	eq: Mkey;
	is: Skey;
	not: Filter;
}

export interface Mkey {
	avg: number;
	pass: number;
	fail: number;
	audit: number;
	year: number;
}

export interface Skey {
	dept: string;
	id: string;
	instructor: string;
	title: string;
	uuid: string;
}
