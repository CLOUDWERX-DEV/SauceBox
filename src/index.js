import { AppRegistry } from 'react-native';
import App from './App';

AppRegistry.registerComponent('LocalFap', () => App);
AppRegistry.runApplication('LocalFap', {
  rootTag: document.getElementById('root')
});
