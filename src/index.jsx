import "preact/debug";
import { render } from 'preact';
import './style.css';
import Calculator from './components/calculator';



export function App() {
	return (
		<div>
			<h1>Undertime</h1>
			<section>
				<Calculator></Calculator>
			</section>
		</div>
	);
}



function Resource(props) {
	return (
		<a href={props.href} target="_blank" class="resource">
			<h2>{props.title}</h2>
			<p>{props.description}</p>
		</a>
	);
}

render(<App />, document.getElementById('app'));
