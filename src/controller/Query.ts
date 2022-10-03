export interface Query {
	where: {
		filter?: []; // | {}...
	};
	options: {
		columns: string[]; // check later at least one
		order?: string; // check later order is in column
	};
}

// enum mfield {
// 	avg,
// 	pass,
// 	fail,
// 	audit,
// 	year,
// }

// enum sfield {
// 	dept,
// 	id,
// 	instructor,
// 	title,
// 	uuid,
// }
