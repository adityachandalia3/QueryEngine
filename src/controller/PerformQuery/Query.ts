export interface Query {
	WHERE: Filter;
	OPTIONS: {
		COLUMNS: string[];
		ORDER?: string;
	};
	TRANSFORMATIONS: {
		GROUP: string[];
		APPLY: string;
	}
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
	// Sections
	avg: number;
	pass: number;
	fail: number;
	audit: number;
	year: number;
	// Rooms
	lat: number;
	lon: number;
	seats: number;
}

export interface Skey {
	// Sections
	dept: string;
	id: string;
	instructor: string;
	title: string;
	uuid: string;
	// Rooms
	fullname: string;
	shortname: string;
	number: string;
	name: string;
	address: string;
	type: string;
	furniture: string;
	href: string;
}
