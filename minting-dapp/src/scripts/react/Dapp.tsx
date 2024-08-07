import React from 'react';
import { ethers, BigNumber } from 'ethers';
import { ExternalProvider, Web3Provider } from '@ethersproject/providers';
import detectEthereumProvider from '@metamask/detect-provider';
import { abi, ContractConfig } from '../../../config';
import CollectionStatus from './CollectionStatus';
import MintWidget from './MintWidget';
import Whitelist from '../lib/Whitelist';
import { toast } from 'react-toastify';

interface Props {}

interface State {
  userAddress: string | null;
  network: ethers.providers.Network | null;
  networkConfig: any;
  totalSupply: number;
  maxSupply: number;
  maxMintAmountPerTx: number;
  tokenPrice: BigNumber;
  isPaused: boolean;
  loading: boolean;
  isWhitelistMintEnabled: boolean;
  isUserInWhitelist: boolean;
  merkleProofManualAddress: string;
  merkleProofManualAddressFeedbackMessage: string | JSX.Element | null;
  errorMessage: string | JSX.Element | null;
}

const defaultState: State = {
  userAddress: null,
  network: null,
  networkConfig: ContractConfig.networkConfig.mainnet,
  totalSupply: 0,
  maxSupply: 0,
  maxMintAmountPerTx: 0,
  tokenPrice: BigNumber.from(0),
  isPaused: true,
  loading: false,
  isWhitelistMintEnabled: false,
  isUserInWhitelist: false,
  merkleProofManualAddress: '',
  merkleProofManualAddressFeedbackMessage: null,
  errorMessage: null,
};

const errorMapping: { [key: string]: string } = {
  'User rejected transaction': 'User rejected transaction',
  'insufficient funds': 'Insufficient funds to complete the transaction',
  'network error': 'A network error occurred. Please try again later',
  'invalid address': 'Invalid address. Please check and try again',
  // Add more mappings as needed
};

export default class Dapp extends React.Component<Props, State> {
  provider!: Web3Provider;
  contract!: ethers.Contract;
  private merkleProofManualAddressInput!: HTMLInputElement;

  constructor(props: Props) {
    super(props);
    this.state = defaultState;
    this.setError = this.setError.bind(this);
  }

  componentDidMount = async () => {
    const browserProvider = await detectEthereumProvider() as ExternalProvider;

    if (browserProvider?.isMetaMask !== true) {
      this.setError(
        <>
          We were not able to detect <strong>MetaMask</strong>. If you are on mobile please open the link on Metamask browser or your wallets browser for best expierence.
        </>,
      );
    }

    this.provider = new ethers.providers.Web3Provider(browserProvider);
    this.registerWalletEvents(browserProvider);
    await this.initWallet();
  }

  async mintTokens(amount: number): Promise<void> {
    try {
      this.setState({loading: true});
      const transaction = await this.contract.mint(amount, { value: this.state.tokenPrice.mul(amount) });

      toast.info(<>Transaction sent! Please wait...<br/>
        <a href={this.generateTransactionUrl(transaction.hash)} target="_blank" rel="noopener">View on {this.state.networkConfig.blockExplorer.name}</a>
      </>);

      const receipt = await transaction.wait();

      toast.success(<>Success!<br />
        <a href={this.generateTransactionUrl(receipt.transactionHash)} target="_blank" rel="noopener">View on {this.state.networkConfig.blockExplorer.name}</a>
      </>);

      this.refreshContractState();
      this.setState({loading: false});
    } catch (e) {
      this.setError(e);
      this.setState({loading: false});
    }
  }

  async whitelistMintTokens(amount: number): Promise<void> {
    try {
      this.setState({loading: true});
      const transaction = await this.contract.whitelistMint(amount, Whitelist.getProofForAddress(this.state.userAddress!), { value: this.state.tokenPrice.mul(amount) });

      toast.info(<>Transaction sent! Please wait...<br/>
        <a href={this.generateTransactionUrl(transaction.hash)} target="_blank" rel="noopener">View on {this.state.networkConfig.blockExplorer.name}</a>
      </>);

      const receipt = await transaction.wait();

      toast.success(<>Success!<br />
        <a href={this.generateTransactionUrl(receipt.transactionHash)} target="_blank" rel="noopener">View on {this.state.networkConfig.blockExplorer.name}</a>
      </>);

      this.refreshContractState();
      this.setState({loading: false});
    } catch (e) {
      this.setError(e);
      this.setState({loading: false});
    }
  }

  private isWalletConnected(): boolean {
    return this.state.userAddress !== null;
  }

  private isContractReady(): boolean {
    return this.contract !== undefined;
  }

  private isSoldOut(): boolean {
    return this.state.maxSupply !== 0 && this.state.totalSupply >= this.state.maxSupply;
  }

  private isNotMainnet(): boolean {
    return this.state.network !== null && this.state.network.chainId !== ContractConfig.networkConfig.mainnet.chainId;
  }

  private copyMerkleProofToClipboard(): void {
    const merkleProof = Whitelist.getRawProofForAddress(this.state.userAddress ?? this.state.merkleProofManualAddress);

    if (merkleProof.length < 1) {
      this.setState({
        merkleProofManualAddressFeedbackMessage: 'The given address is not in the whitelist, please double-check.',
      });
      return;
    }

    navigator.clipboard.writeText(merkleProof);

    this.setState({
      merkleProofManualAddressFeedbackMessage: 
      <>
        <strong>Congratulations!</strong> <span className="emoji">🎉</span><br />
        Your Merkle Proof <strong>has been copied to the clipboard</strong>. You can paste it into <a href={this.generateContractUrl()} target="_blank">{this.state.networkConfig.blockExplorer.name}</a> to claim your tokens.
      </>,
    });
  }

  render() {
    return (
      <>
        {this.isNotMainnet() ?
          <div className="not-mainnet">
            You are not connected to the main network.
            <span className="small">Current network: <strong>{this.state.network?.name}</strong></span>
          </div>
          : null}

        {this.state.errorMessage ? (
          <div className="error">
            <p>{this.state.errorMessage}</p>
            <button onClick={() => this.setError(null)}>Close</button>
          </div>
        ) : null}

        {this.isWalletConnected() ?
          <>
            {this.isContractReady() ?
              <>
                <CollectionStatus
                  userAddress={this.state.userAddress}
                  maxSupply={this.state.maxSupply}
                  totalSupply={this.state.totalSupply}
                  isPaused={this.state.isPaused}
                  isWhitelistMintEnabled={this.state.isWhitelistMintEnabled}
                  isUserInWhitelist={this.state.isUserInWhitelist}
                  isSoldOut={this.isSoldOut()}
                />
                {!this.isSoldOut() ?
                  <MintWidget
                    networkConfig={this.state.networkConfig}
                    maxSupply={this.state.maxSupply}
                    totalSupply={this.state.totalSupply}
                    tokenPrice={this.state.tokenPrice}
                    maxMintAmountPerTx={this.state.maxMintAmountPerTx}
                    isPaused={this.state.isPaused}
                    isWhitelistMintEnabled={this.state.isWhitelistMintEnabled}
                    isUserInWhitelist={this.state.isUserInWhitelist}
                    mintTokens={(mintAmount) => this.mintTokens(mintAmount)}
                    whitelistMintTokens={(mintAmount) => this.whitelistMintTokens(mintAmount)}
                    loading={this.state.loading}
                  />
                  :
                  <div className="collection-sold-out">
                    <h2>Tokens have been <strong>sold out</strong>! <span className="emoji">🥳</span></h2>
                    You can buy from our beloved holders on <a href={this.generateMarketplaceUrl()} target="_blank">{ContractConfig.marketplaceConfig.name}</a>.
                  </div>
                }
              </>
              :
              <div className="collection-not-ready">
                <svg className="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading collection data...
              </div>
            }
          </>
        :
          <div className="no-wallet">
            {!this.isWalletConnected() ? <button className="primary" disabled={this.provider === undefined} onClick={() => this.connectWallet()}>Connect Wallet</button> : null}
          </div>
        }
      </>
    );
  }

  private setError = (error: any = null): void => {
    let errorMessage = 'Unknown error...';

    if (error === null) {
      this.setState({ errorMessage: null });
      return;
    }

    if (typeof error === 'string') {
      errorMessage = error;
    } else if (typeof error === 'object') {
      if (error?.error?.message !== undefined) {
        errorMessage = error.error.message;
      } else if (error?.data?.message !== undefined) {
        errorMessage = error.data.message;
      } else if (error?.message !== undefined) {
        errorMessage = error.message;
      } else if (React.isValidElement(error)) {
        this.setState({ errorMessage: error });
        return;
      }
    }

    for (const pattern in errorMapping) {
      if (errorMessage && errorMessage.toLowerCase().includes(pattern.toLowerCase())) {
        errorMessage = errorMapping[pattern];
        break;
      }
    }

    this.setState({
      errorMessage: errorMessage ? errorMessage.charAt(0).toUpperCase() + errorMessage.slice(1) : null,
    });
  }

  private generateContractUrl(): string {
    return this.state.networkConfig.blockExplorer.generateContractUrl(ContractConfig.contractAddress);
  }

  private generateMarketplaceUrl(): string {
    return ContractConfig.marketplaceConfig.generateCollectionUrl(ContractConfig.marketplaceIdentifier, !this.isNotMainnet());
  }

  private generateTransactionUrl(transactionHash: string): string {
    return this.state.networkConfig.blockExplorer.generateTransactionUrl(transactionHash);
  }

  private async connectWallet(): Promise<void> {
    try {
      await this.provider.provider.request!({ method: 'eth_requestAccounts' });
      this.initWallet();
    } catch (e) {
      this.setError(e);
    }
  }

  private async refreshContractState(): Promise<void> {
    this.setState({
      maxSupply: (await this.contract.maxSupply()).toNumber(),
      totalSupply: (await this.contract.totalSupply()).toNumber(),
      maxMintAmountPerTx: (await this.contract.maxMintAmountPerTx()).toNumber(),
      tokenPrice: await this.contract.cost(),
      isPaused: await this.contract.paused(),
      isWhitelistMintEnabled: await this.contract.whitelistMintEnabled(),
      isUserInWhitelist: Whitelist.contains(this.state.userAddress ?? ''),
    });
  }

  private async initWallet(): Promise<void> {
    const walletAccounts = await this.provider.listAccounts();
    this.setState(defaultState);

    if (walletAccounts.length === 0) {
      return;
    }

    const network = await this.provider.getNetwork();
    let networkConfig: any;

    if (network.chainId === ContractConfig.networkConfig.mainnet.chainId) {
      networkConfig = ContractConfig.networkConfig.mainnet;
    } else if (network.chainId === ContractConfig.networkConfig.testnet.chainId) {
      networkConfig = ContractConfig.networkConfig.testnet;
    } else {
      this.setError('Unsupported network!');
      return;
    }

    this.setState({
      userAddress: walletAccounts[0],
      network,
      networkConfig,
    });

    if (await this.provider.getCode(ContractConfig.contractAddress) === '0x') {
      this.setError('Could not find the contract, are you connected to the right chain?');
      return;
    }

    this.contract = new ethers.Contract(
      ContractConfig.contractAddress,
      abi,
      this.provider.getSigner(),
    );

    this.refreshContractState();
  }

  private registerWalletEvents(browserProvider: ExternalProvider): void {
    // @ts-ignore
    browserProvider.on('accountsChanged', () => {
      this.initWallet();
    });

    // @ts-ignore
    browserProvider.on('chainChanged', () => {
      window.location.reload();
    });
  }
}

