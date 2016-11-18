/**
 * In this file, we create a React component
 * which incorporates components provided by Material-UI.
 */
 import React, {Component} from 'react';
 import asyncify from 'async/asyncify';

 import { Router, Route, Link, browserHistory } from 'react-router';
 import {List, ListItem, makeSelectable} from 'material-ui/List';
 import {Card, CardActions, CardHeader, CardText} from 'material-ui/Card';
 import FontIcon from 'material-ui/FontIcon';
 import FlatButton from 'material-ui/FlatButton';
 import Toggle from 'material-ui/Toggle';

 import CircularProgress from 'material-ui/CircularProgress';

 import IconMenu from 'material-ui/IconMenu';
 import MenuItem from 'material-ui/MenuItem';
 import Divider from 'material-ui/Divider';
 import IconButton from 'material-ui/IconButton';
 import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
 import UndoIcon from 'material-ui/svg-icons/content/undo';
 import {red100, red200, red500, grey200, grey400, darkBlack, lightBlack} from 'material-ui/styles/colors';

 import CategoryStore from '../stores/CategoryStore';
 import CategoryActions from '../actions/CategoryActions';

 import CategoryForm from './categories/CategoryForm';
 import CategoryDelete from './categories/CategoryDelete';


 const styles = {
  container: {
    textAlign: 'left',
  },
  button: {
    float: 'right',
    marginTop: '26px',
  },
  loading: {
    textAlign: 'center',
    padding: '50px 0',
  },
  list: {
    textAlign: 'left',
  },
  listItem: {
    paddingLeft: '14px',
  },
  listItemDeleted: {
    paddingLeft: '14px',
    color: red500,
  },
  icons: {
  },
  link: {
    textDecoration: 'none'
  },
  afterCardActions: {
    padding: '35px 20px 0px 20px',
    fontSize: '1.2em',
  }
 };

const iconButtonElement = (
  <IconButton
    touch={true}
    tooltip="more"
    tooltipPosition="top-left"
  >
    <MoreVertIcon color={grey400} />
  </IconButton>
);

 let categories = [];

 class Categories extends Component {

  constructor(props, context) {
    super(props, context);

    this.state = {
      categories: [],
      loading: true,
      selectedCategory: {},
      open: false,
      openDelete: false,
      toggled: false,
    };
    this.context = context;
  }

  rightIconMenu(category) {
    return (
      <IconMenu iconButtonElement={iconButtonElement}>
        <MenuItem onTouchTap={() => this._handleOpenCategory(category) }>Edit</MenuItem>
        <MenuItem onTouchTap={() => this._handleAddSubCategory(category) }>Add sub category</MenuItem>
        <Divider />
        <MenuItem onTouchTap={() => this._handleOpenDeleteCategory(category) }>Delete</MenuItem>
      </IconMenu>
    )
  }

  rightIconMenuDeleted(category) {
    return (
      <IconButton
          touch={true}
          tooltip="undelete"
          tooltipPosition="top-left"
          onTouchTap={() => this._handleUndeleteCategory(category) }
        >
        <UndoIcon color={grey400} />
      </IconButton>
    )
  }

  nestedCategory(category) {
    if (!this.state.toggled && !category.active) {
      return '';
    }
    return (
      <ListItem
        style={category.active ? styles.listItem : styles.listItemDeleted}
        key={category.id}
        primaryText={category.name}
        secondaryText={category.description}
        rightIconButton={category.active ? this.rightIconMenu(category) : this.rightIconMenuDeleted(category)}
        open={true}
        onTouchTap={() => {
          this.context.router.push('/categories/'+category.id);
        }}
        nestedItems={category.children.map((children) => {
          return this.nestedCategory(children);
        })}
      />
    );
  }

  componentWillMount() {
    CategoryStore.addChangeListener(this._updateData);
  }

  componentDidMount() {
    CategoryActions.read();
  }

  componentWillUnmount() {
    CategoryStore.removeChangeListener(this._updateData);
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      open: false,
      openDelete: false,
    });
  }

  _handleToggleDeletedCategories = () => {
    this.setState({
      toggled: !this.state.toggled,
      openDelete: false,
    });
  };


  _handleUndeleteCategory = (category) => {
    category.active = true;
    CategoryActions.update(category);
  };

  _handleOpenCategory = (category) => {
    this.setState({
      open: true,
      openDelete: false,
      selectedCategory: category,
    });
  };

  _handleOpenDeleteCategory = (category) => {
    this.setState({
      open: false,
      openDelete: true,
      selectedCategory: category,
    });
  };

  _handleAddSubCategory = (category) => this._handleOpenCategory({ parent: category.id});

  _updateData = () => {
    this.setState({
      categories: CategoryStore.getAllCategories().filter((category) => {
        return category.active === true || this.state.toggled
      }),
      loading: false,
    });
  }

  render() {
    return (
      <div className="list_detail_container" style={styles.container}>
        <div className="list_layout">
          <FlatButton label="New" style={styles.button} onTouchTap={this._handleOpenCategory} />
          <h1>Categories</h1>
          <Card>
            { this.state.loading ?
              <div style={styles.loading}>
                <CircularProgress />
              </div>
              :
              <List style={styles.list}>
                {this.state.categories.map((children) => {
                  return this.nestedCategory(children);
                })}
              </List>

            }
          </Card>
          <div style={styles.afterCardActions}>
            <Toggle
              label="Show deleted categories"
              toggle={this.state.toggled}
              onToggle={this._handleToggleDeletedCategories}
            />
          </div>
        </div>
        <div className="list_detail">
          {this.props.children}
        </div>
        <div className="clearfix"></div>
        <CategoryForm category={this.state.selectedCategory} open={this.state.open}></CategoryForm>
        <CategoryDelete category={this.state.selectedCategory} open={this.state.openDelete}></CategoryDelete>
      </div>
    );
  }
}

// Inject router in context
Categories.contextTypes = {
  router: React.PropTypes.object.isRequired
};


export default Categories;
