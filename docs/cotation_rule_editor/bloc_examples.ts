enum BlocType {
	INPUT_VARIABLE = "input_variable",
	DEFINE_VARIABLE = "define_variable",
	CONDITION = "condition",
	OPERATION = "operation",
	LOOP = "loop",
	CONTINUE = "continue",
	BREAK = "break",
	FUNCTION_CALL = "function_call",
}


const input_variable = {
	"id": "var1",
	"type": "input_variable",
	"name": "capital",
	"label": "Capital assuré",
	"source": "formulaire",
	"dataType": "number"
}

const define_variable = {
	id: "var2",
	type: "define_variable",
	name: "prime_brute",
	expression: {
		operation: "*",
		operands: ["capital", "taux"],
	},
};

const condition = {
	id: "cond1",
	type: "condition",
	test: {
		left: "age",
		operator: ">",
		right: 60,
	},
	then: [
		{
			type: "operation",
			expression: {
				operation: "*",
				operands: ["prime_brute", 1.2],
			},
			assignTo: "prime_brute",
		},
	],
	else: [],
};

const operation = {
	id: "op1",
	type: "operation",
	expression: {
		operation: "+",
		operands: ["prime_brute", "frais_fixes"],
	},
	assignTo: "prime_totale",
};

const loop = {
	id: "loop1",
	type: "loop",
	loopVariable: "garantie",
	collection: "garanties_supplementaires",
	body: [
		{
			type: "define_variable",
			name: "prime_garantie",
			expression: {
				operation: "*",
				operands: ["garantie.capital", "garantie.taux"],
			},
		},
		{
			type: "operation",
			expression: {
				operation: "+",
				operands: ["prime_total_temp", "prime_garantie"],
			},
			assignTo: "prime_total_temp",
		},
	],
};

const loop_continue = {
	type: "continue",
	test: {
		left: "garantie",
		operator: "==",
		right: "suicide",
	},
};

const loop_break = {
	type: "break",
	condition: {
		left: "garantie.capital",
		operator: "<=",
		right: 0,
	},
};

const function_call = {
  "id": "func1",
  "type": "function_call",
  "name": "sort",
  "args": [
    { "type": "variable", "value": "garanties" },
    { "type": "string", "value": "capital" },
    { "type": "string", "value": "desc" }
  ],
  "assignTo": "garanties_triees"
}
