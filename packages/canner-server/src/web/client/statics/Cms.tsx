import * as React from 'react';
import {Layout, notification, Modal, Button} from 'antd';
import Canner from 'canner';
import Container, {transformSchemaToMenuConfig} from '@canner/container';
import R from '@canner/history-router';
import Error from './Error';
import styled from 'styled-components';
import { createHttpLink } from 'apollo-link-http';
import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';

const confirm = Modal.confirm;

export const Logo = styled.img`
  padding: 20px 0;
  width: 160px;
`;

type Props = {
  history: Object,
  match: Object,
  location: Object,
};

type State = {
  hasError: boolean,
  prepare: boolean,
  client: ApolloClient<any>
}

export default class CMSPage extends React.Component<Props, State> {
  client: ApolloClient<any>;

  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      prepare: false,
      client: null
    };
  }

  async componentDidMount() {
    const client = await this.createClient();
    this.setState({
      prepare: true,
      client
    });
    
  }

  createClient = async (): Promise<ApolloClient<any>> => {
    const token = await getAccessToken();
    const link: any =  createHttpLink({
      uri: `/graphql`,
      headers: token ?
        { Authentication: `Bearer ${token}` } :
        {},
    });
    return new ApolloClient({
      cache: new InMemoryCache(),
      link
    });
  }

  componentDidCatch(error, info) {
    // Display fallback UI
    this.setState({ hasError: true });
    console.log(error, info);
  }

  handleClickResetButton = () => {
    confirm({
      title: 'Do you want to reset all data?',
      content: '',
      okText: 'Yes',
      cancelText: 'No',
      onOk: () => {
        localStorage.removeItem(schema.connector.localStorageKey);
        location.reload();
      },
      onCancel: () => {
      },
    });
    
  }

  render() {
    const { history } = this.props;
    const { prepare, hasError, client } = this.state;
    if (hasError) return <Error />;

    if (!prepare) return null;
    const {
      schema,
      cloudConfig
    } = window as any;

    const sidebar =
      cloudConfig.sidebarMenu || transformSchemaToMenuConfig({...schema.pageSchema, ...schema.schema});
    return (
      <Layout style={{ minHeight: "100vh" }}>
        <Container
          schema={schema}
          sidebarConfig={{
            menuConfig: [...sidebar],
            theme: cloudConfig.sidebarTheme,
            mode: cloudConfig.sidebarMode,
            style: cloudConfig.sidebarStyle,
            menuStyle: cloudConfig.sidebarMenuStyle
          }}
          navbarConfig={{
            showSaveButton: true,
            logo: <Logo src={cloudConfig.logo || 'https://cdn.canner.io/images/logo/logo-word-white.png'} />,
            theme: cloudConfig.navbarTheme,
            style: cloudConfig.navbarStyle,
            menuStyle: cloudConfig.navbarMenuStyle
          }}
          router={
            new R({
              history,
              baseUrl: baseUrl === '/' ? '' : (baseUrl || '')
            })
          }
        >
          <Canner
            client={this.client}
            schema={schema}
            afterDeploy={() => {
              notification.success({
                placement: "bottomRight",
                message: "Successfully Updated!",
                description: ""
              });
            }}
            client={client}
          />
        </Container>
      </Layout>
    );
  }
}