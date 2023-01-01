/* global require, __dirname */
const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const outputDir = path.resolve(__dirname, isProduction ? 'dist' : 'dev');
const config = {
	entry: './src/index.js',
	output: {
		filename: 'atlasmap.js',
		path: outputDir,
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: 'src/example.html',
			filename: 'example.html',
		}),
		new MiniCssExtractPlugin({
			filename: 'style.css',
		}),
		new CopyPlugin({
			patterns: [
				{from: 'icons/*', context: "src/"},
				{from: 'images/*', context: "src/"},
				{from: '*.png', context: "src/"},
			],
		}),
	],
	resolve: {
		modules: [path.resolve(__dirname, 'src'), 'node_modules'],
	},
	module: {
		rules: [
			{
				test: /\.(js|jsx)$/i,
				loader: 'babel-loader',
			},
			{
				test: /\.css$/i,
				use: [
					MiniCssExtractPlugin.loader,
					{loader: 'css-loader', options: {url: false, import: true, modules: false}},
				],
			},
			{
				test: /\.svg$/,
				loader: 'svg-inline-loader',
			},
			{
				test: /\.(eot|ttf|woff|woff2|png|jpg|gif)$/i,
				type: 'asset',
			},
		],
	},
};

module.exports = () => {
	if (isProduction) {
		config.mode = 'production';
	} else {
		config.mode = 'development';
	}
	config.devtool = false;

	return config;
};
