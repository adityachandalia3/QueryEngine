export interface Query {
	WHERE: Filter;
	OPTIONS: {
		COLUMNS: string[];
		ORDER?: string;
	};
}

export interface Filter {
	AND: Filter[];
	OR: Filter[];
	LT: Mkey;
	GT: Mkey;
	EQ: Mkey;
	IS: Skey;
	NOT: Filter;
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
