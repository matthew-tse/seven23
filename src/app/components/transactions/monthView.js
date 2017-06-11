/**
 * In this file, we create a React component
 * which incorporates components provided by Material-UI.
 */
import React, {Component} from 'react';
import moment from 'moment';

import CircularProgress from 'material-ui/CircularProgress';
import {Card, CardText} from 'material-ui/Card';
import {Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn}
  from 'material-ui/Table';

import {Tabs, Tab} from 'material-ui/Tabs';

import {cyan500, cyan700, white, grey100} from 'material-ui/styles/colors';
import IconButton from 'material-ui/IconButton';
import NavigateBefore from 'material-ui/svg-icons/image/navigate-before';
import NavigateNext from 'material-ui/svg-icons/image/navigate-next';
import DateRange from 'material-ui/svg-icons/action/date-range';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import ContentAdd from 'material-ui/svg-icons/content/add';

import AccountStore from '../../stores/AccountStore';
import CurrencyStore from '../../stores/CurrencyStore';
import CategoryStore from '../../stores/CategoryStore';
import CategoryActions from '../../actions/CategoryActions';
import TransactionActions from '../../actions/TransactionActions';
import TransactionStore from '../../stores/TransactionStore';
import TransactionForm from './TransactionForm';
import TransactionTable from './TransactionTable';

import TransactionChartDailySum from './charts/TransactionChartDailySum';

const styles = {
  headerTitle: {
    color: 'white',
    fontSize: '4em',
  },
  inkbar: {
    backgroundColor: '#004D40',
  },
  loading: {
    textAlign: 'center',
    padding: '50px 0',
  },
  loadingBig: {
    textAlign: 'center',
    padding: '245px 0',
  },
  outcome: {
    textAlign: 'right',
  },
  outcomeValue: {
    textAlign: 'right',
    fontSize: '1.5em',
    color: 'red',
  },
  incomeValue: {
    textAlign: 'left',
    fontSize: '1.5em',
    color: 'green',
  },
};

class MonthView extends Component {
  constructor(props, context) {
    super(props, context);

    let now = new Date();
    this.state = {
      year: props.year ? parseInt(props.year) : now.getFullYear(),
      month: props.month ? parseInt(props.month) : (now.getMonth()%12+1),
      loading: true,
      transactions: null,
      categories: null,
      categoriesSummed: null,
      outcome: 0,
      income: 0,
      selectedTransaction: {},
      graph: {},
      tabs: 'overview',
      open: false,
    };
    this.context = context;
  }

  handleOpenTransaction = (item={}) => {
    this.setState({
      open: true,
      selectedTransaction: item,
    });
  };

  _updateTransaction = (transaction) => {
    if (transaction && transaction.id) {
      let list = this.state.transactions.filter((item) => { return item.id !== transaction.id });
      list.push(transaction);
      this._updateData(list);
    }
  };

  _updateData = (transactions) => {
    if (transactions && Array.isArray(transactions)) {

      let dailyExpensesIndexed = {};
      let categories = [];
      let income = 0;
      let outcome = 0;

      // Generate dailyExpensesIndexed and categories data set
      transactions.forEach((transaction) => {
        if (transaction.amount <= 0) {
          outcome += transaction.amount;
        } else {
          income += transaction.amount;
        }
        if (transaction.amount <= 0) {
          if (!dailyExpensesIndexed[transaction.date]) {
            dailyExpensesIndexed[transaction.date] = 0;
          }
          if (transaction.amount <= 0) {
            dailyExpensesIndexed[transaction.date] += transaction.amount;
            // Update price per category
            if (transaction.category) {
              if (!categories[transaction.category]) {
                categories[transaction.category] = 0;
              }
              categories[transaction.category] += transaction.amount;
            }
          }
        }
      });

      // Order transactions by date and calculate sum for graph
      let dataLabel = new Map();
      Object.keys(dailyExpensesIndexed).sort((a, b) => { return a < b ? -1 : 1; }).forEach((day) => {
        dataLabel.set(moment(day, 'YYYY-MM-DD').format('ddd DD'), parseFloat(dailyExpensesIndexed[day].toFixed(2))*-1);
      });

      let graph = {
        type: 'bar',
        data: {
          labels: [...dataLabel.keys()],
          datasets: [{
            label: CurrencyStore.getIndexedCurrencies()[CurrencyStore.getSelectedCurrency()].name,
            data: [...dataLabel.values()],
            backgroundColor: cyan500,
            borderColor: cyan500,
            borderWidth: 1
          }]
        },
        options: {
          legend: {
            display: false,
          },
          scales: {
            yAxes: [{
              ticks: {
                beginAtZero:true
              }
            }]
          }
        }
      };

      this.setState({
        loading: false,
        graph: graph,
        transactions: transactions,
        outcome: outcome,
        income: income,
        open: false,
        categoriesSummed: Object.keys(categories).map((id) => {
          return {category: id, amount: categories[id]};
        }).sort((a, b) => {
          return a.amount > b.amount ? 1 : -1;
        }),
        snackbar: {
          open: false,
          message: '',
        }
      });
    }
  };

  _addData = (transaction) => {
    if (!Array.isArray(transaction) &&
      transaction.date.slice(0,7) === this.state.year + '-' + ('0' + this.state.month).slice(-2)) {
      this.state.transactions.push(transaction);
      this._updateData(this.state.transactions);
    }
  };

  _updateAccount = () => {
    this.setState({
      transactions: null,
      categories: null,
      loading: true,
    });

    CategoryActions.read();
    TransactionActions.read({
      year: this.state.year,
      month: this.state.month
    });
  };

  _updateCategories = (categories) => {
    if (categories && Array.isArray(categories)) {
      this.setState({
        categories: categories
      });
    }
  };

  _deleteData = (transaction) => {
    let list = this.state.transactions.filter((item) => { return item.id !== transaction.id });
    this.setState({
      transactions: list,
    });
    this._updateData(list);
  };

  _goMonthBefore = () => {
    let newYear = (this.state.month === 1 ? this.state.year-1 : this.state.year),
      newMonth = (this.state.month === 1 ? 12 : this.state.month-1);

    this.context.router.push('/transactions/'+newYear+'/'+newMonth);
  };

  _goMonthNext = () => {
    let newYear = (this.state.month === 12 ? this.state.year+1 : this.state.year),
      newMonth = (this.state.month === 12 ? 1 : this.state.month+1);

    this.context.router.push('/transactions/'+newYear+'/'+newMonth);
  };

  _onTabChange = (value) => {
    this.setState({
      tabs: value,
      open: false,
    });
  };

  componentWillMount() {
    AccountStore.addChangeListener(this._updateAccount);
    TransactionStore.addAddListener(this._addData);
    TransactionStore.addUpdateListener(this._updateTransaction);
    TransactionStore.addChangeListener(this._updateData);
    TransactionStore.addDeleteListener(this._deleteData);
    CurrencyStore.addChangeListener(this._updateData);
    CategoryStore.addChangeListener(this._updateCategories);
  }

  componentDidMount() {
    // Timout allow allow smooth transition in navigation
    setTimeout(() => {
      CategoryActions.read();
      TransactionActions.read({
        year: this.state.year,
        month: this.state.month
      });
    }, 350);
  }

  componentWillUnmount() {
    AccountStore.removeChangeListener(this._updateAccount);
    TransactionStore.removeAddListener(this._addData);
    TransactionStore.removeChangeListener(this._updateData);
    TransactionStore.removeUpdateListener(this._updateTransaction);
    TransactionStore.removeDeleteListener(this._deleteData);
    CurrencyStore.removeChangeListener(this._updateData);
    CategoryStore.removeChangeListener(this._updateCategories);
  }

  componentWillReceiveProps(nextProps) {

    let now = new Date();
    let year = nextProps.year ? parseInt(nextProps.year) : now.getFullYear();
    let month = nextProps.month ? parseInt(nextProps.month) : (now.getMonth()%12+1);
    this.setState({
      year: year,
      month: month,
      open: false,
      loading: true,
    });
    TransactionActions.read({
      year: year,
      month: month
    });
  }

  render() {
    return (
      <div>
        <div className={"layout40-60 " + this.state.tabs}>
          <Card className="column">
            <div className="columnHeader">
              <header className="primaryColorBackground">
                <h1 style={styles.headerTitle}>{ moment.months()[this.state.month-1]} {this.state.year}</h1>

                <div className="navigationButtons">
                  <IconButton
                    tooltip={moment(this.state.year+'-'+this.state.month, 'YYYY-MM').subtract(1, 'month').format('MMMM YY')}
                    tooltipPosition="bottom-right"
                    touch={false}
                    className="previous"
                    onTouchTap={this._goMonthBefore}><NavigateBefore color={white} /></IconButton>
                  <IconButton touch={false} className="calendar"><DateRange color={grey100} /></IconButton>
                  <IconButton
                    tooltip={moment(this.state.year+'-'+this.state.month, 'YYYY-MM').add(1, 'month').format('MMMM YY')}
                    tooltipPosition="bottom-left"
                    touch={false}
                    className="next"
                    onTouchTap={this._goMonthNext}><NavigateNext color={white} /></IconButton>
                </div>
                <FloatingActionButton className="addButton" onTouchTap={this.handleOpenTransaction}>
                  <ContentAdd />
                </FloatingActionButton>
                <Tabs value={this.state.tabs} onChange={this._onTabChange} className="tabs" tabItemContainerStyle={{backgroundColor: 'transparent'}} inkBarStyle={styles.inkbar}>
                  <Tab value="overview" label="Overview"/>
                  <Tab value="transactions" label="Transactions"/>
                </Tabs>
              </header>

              <article id="month_overview">
              { this.state.loading ?
                <div style={styles.loading}>
                  <CircularProgress />
                </div>
                :
                <Table>
                  <TableHeader
                    displaySelectAll={false}
                    adjustForCheckbox={false}>
                    <TableRow>
                      <TableHeaderColumn>Income</TableHeaderColumn>
                      <TableHeaderColumn style={styles.outcome}>Outcome</TableHeaderColumn>
                    </TableRow>
                  </TableHeader>
                  <TableBody
                    displayRowCheckbox={false}
                    showRowHover={true}
                    stripedRows={false}
                  >
                    <TableRow>
                      <TableRowColumn style={styles.incomeValue}>{ CurrencyStore.format(this.state.income) }</TableRowColumn>
                      <TableRowColumn style={styles.outcomeValue}>{ CurrencyStore.format(this.state.outcome) }</TableRowColumn>
                    </TableRow>
                  </TableBody>
                </Table>
              }
              <CardText>
              { this.state.loading ?
                <div style={styles.loading}>
                </div>
                :
                <TransactionChartDailySum config={this.state.graph}></TransactionChartDailySum>
              }
              </CardText>
              { this.state.loading || !this.state.categories ?
                <div style={styles.loading}>
                </div>
                :
                <Table>
                  <TableHeader
                    displaySelectAll={false}
                    adjustForCheckbox={false}>
                    <TableRow>
                      <TableHeaderColumn>Category</TableHeaderColumn>
                      <TableHeaderColumn style={styles.amount}>Amount</TableHeaderColumn>
                    </TableRow>
                  </TableHeader>
                  <TableBody
                    displayRowCheckbox={false}
                    showRowHover={true}
                    stripedRows={false}
                  >
                  { this.state.categoriesSummed.map((item) => {
                    return (
                        <TableRow key={item.category}>
                          <TableRowColumn>{ this.state.categories.find((category) => { return ''+category.id === ''+item.category; }).name }</TableRowColumn>
                          <TableRowColumn style={styles.amount}>{ CurrencyStore.format(item.amount) }</TableRowColumn>
                        </TableRow>
                    );
                  })
                  }
                  </TableBody>
                </Table>
              }
              </article>
            </div>
          </Card>
          <Card className="column" id="month_transactions">
            <div className="columnHeader">
              <header className="primaryColorBackground small">
                <p>{ this.state.transactions ? this.state.transactions.length : '' } transactions</p>
              </header>
              <article>
              { this.state.loading || !this.state.categories ?
                <div style={styles.loadingBig}>
                  <CircularProgress />
                </div>
                :
                <TransactionTable
                  transactions={this.state.transactions}
                  categories={this.state.categories}></TransactionTable>
              }
              <TransactionForm transaction={this.state.selectedTransaction} open={this.state.open}></TransactionForm>
              </article>
            </div>
          </Card>

        </div>

        <FloatingActionButton className="addButtonBottom" onTouchTap={this.handleOpenTransaction}>
          <ContentAdd />
        </FloatingActionButton>
      </div>
    );
  }
}

// Inject router in context
MonthView.contextTypes = {
  router: React.PropTypes.object.isRequired
};

export default MonthView;
