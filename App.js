import * as SQLite from "expo-sqlite";
import React, {Component, useState, useEffect} from 'react';
import { Alert, TextInput, TouchableOpacity, StyleSheet, Text, View, SafeAreaView } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();
setTimeout(SplashScreen.hideAsync, 2000);

function openDatabase() {
  if (Platform.OS === "web") {
    return {
      transaction: () => {
        return {
          executeSql: () => {},
        };
      },
    };
  }

  const db = SQLite.openDatabase("db.db");
  return db;
}

const db = openDatabase();

function Items() {
  const [items, setItems] = useState(null);

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        `select id, weight, height, bmi, date(itemDate) as itemDate from items ORDER BY itemDate desc;`,[],
        (_, { rows: { _array } }) => setItems(_array)
      );
    });
  }, []);

  if (items === null || items.length === 0) {
    return null;
  }

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.historyHeading}>BMI History</Text>
      {items.map(({ id, weight, height, bmi, itemDate }) => (
        <Text style={styles.historyText} key={id}>{itemDate}:{'\t\t'}{bmi}{'\t\t'}(W:{weight}, H:{height})</Text>
      ))}
    </View>
  );
}

export default class App extends Component {
  state = {
    height: 0,
    weight: 0,
    bmi: 0,
    results: '',
    bmiRange: '',
  };

  //componentWillMount() {
  constructor (props) {
    super (props);
    this.onLoad();
  }

  onLoad = async () => {
    db.transaction((tx) => {
      //tx.executeSql(
      //  "drop table items;"
      //fnpx expo install expo-sqlite);
      tx.executeSql(
        "create table if not exists items (id integer primary key not null, weight real, height real, bmi real, itemDate real);"
      );
    });
  }

  onSave = async () => {
    let bmiResult = (this.state.weight * 703) / (this.state.height * this.state.height);

    if (bmiResult < 18.5) {
      this.setState({
        bmiRange: '(Underweight)',
      });
    } else if (bmiResult >= 18.5 && bmiResult <= 24.9) {
      this.setState({
        bmiRange: '(Healthy)',
      });
    } else if (bmiResult >= 25.0 && bmiResult <= 29.9) {
      this.setState({
        bmiRange: '(Overweight)',
      });
    } else {
      this.setState({
        bmiRange: '(Obese)',
      });
    }

    this.setState({
      results: 'Body Mass Index is ' + bmiResult.toFixed(1),
      bmi: bmiResult.toFixed(1),
    });

    db.transaction(
      (tx) => {
        tx.executeSql("insert into items (weight, height, bmi, itemDate) values (?, ?, ?, julianday('now'))", [this.state.weight, this.state.height, this.state.bmi]);
        tx.executeSql("select * from items", [], (_, { rows }) =>
          console.log(JSON.stringify(rows))
        );
      },
      null,
    );
  }

  render() {
    const { height, results, bmi, bmiRange } = this.state;

    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.toolbar}>BMI Calculator</Text>
        <View>
          <TextInput
            style={styles.input}
            placeholder="Weight in Pounds"
            onChangeText={newText => this.setState({weight: newText})}
          />
          <TextInput 
            style={styles.input}
            onChangeText={height => this.setState({height: height})}
            value={height}
            placeholder="Height in Inches"
          />
          <TouchableOpacity onPress={this.onSave} style={styles.button}>
            <Text style={styles.buttonText}>Compute BMI</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.resultsContainer}>
          <Text style={styles.results}>{results}</Text>
          <Text style={styles.bmiRange}>{bmiRange}</Text>
        </View>
        <View style={styles.pastResultsContainer}>
          <Items />
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  toolbar: {
    backgroundColor: '#f4511e',
    color: '#fff',
    textAlign: 'center',
    padding: 25,
    fontSize: 20,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#ecf0f1',
    fontSize: 24,
    borderRadius: 3,
    height: 40,
    padding: 5,
    margin: 10,
    marginBottom: 5,
  },
  button: {
    backgroundColor: '#34495e',
    padding: 10,
    borderRadius: 3,
    marginBottom: 30,
    margin: 10,
  },
  buttonText: {
    fontSize: 24,
    color: '#fff',
    textAlign: 'center',
  },
  results: {
    fontSize: 28,
    textAlign: 'center',
    marginTop: 15,
  },
  bmiRange: {
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 25,
  },
  historyHeading: {
    fontSize: 24,
    marginBottom: 8,
  },
  historyText: {
    fontSize: 20,
  },
  sectionContainer: {
    paddingLeft: 20,
  },
});
