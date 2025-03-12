import resolve from "@rollup/plugin-node-resolve"

// rollup.config.mjs
export default [{
	input: './main.js',
	plugins: [resolve()
		// , typescript({
		// 	compilerOptions: {
		// 		checkJs: true,
		// 		declaration: true,
		// 		declarationDir: path.resolve("../dist"),
		// 	}
		// })
	],

	output: {
		format: 'es',
		dir: './dist',
		preserveModulesRoot: 'src',
		preserveModules: true,
	},
}

	// {
	// 	input: './cm.js',
	// 	plugins: [resolve(), dts()],
	// 	output: {
	// 		format: 'es',
	// 		dir: '../dist',
	// 		preserveModulesRoot: 'src',
	// 		preserveModules: true,
	// 	},
	// }
];
