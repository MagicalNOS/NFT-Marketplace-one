import { gql, request } from 'graphql-request';

interface ItemListed {
  id: string;
  tokenId: string;
  nftAddress: string;
  seller?: string;
  price?: string;
}

interface ItemBought {
  id: string;
  buyer: string;
  nftAddress: string;
  tokenId: string;
}

interface ItemCanceled {
  id: string;
  seller: string;
  nftAddress: string;
  tokenId: string;
}

interface SubgraphData {
  itemListeds: ItemListed[];
  itemBoughts: ItemBought[];
  itemCanceleds: ItemCanceled[];
}

// 您的实际subgraph端点和配置
const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/121576/nft-markplace/0.0.1';
const headers = { Authorization: `Bearer ${process.env.SUBGRAPH_API_KEY}`}; // 替换为您的实际API key

// 完整的GraphQL查询
const MARKETPLACE_QUERY = gql`{
  itemListeds(first: 1000) {
    id
    tokenId
    nftAddress
    seller
    price
  }
  itemBoughts(first: 1000) {
    id
    buyer
    nftAddress
    tokenId
  }
  itemCanceleds(first: 1000) {
    id
    seller
    nftAddress
    tokenId
  }
}`;

// 查询特定用户的上架NFT
const USER_LISTINGS_QUERY = gql`
  query getUserListings($seller: String!) {
    itemListeds(where: { seller: $seller }, first: 1000) {
      id
      tokenId
      nftAddress
      seller
      price
    }
    itemBoughts(first: 1000) {
      id
      buyer
      nftAddress
      tokenId
    }
    itemCanceleds(where: { seller: $seller }, first: 1000) {
      id
      seller
      nftAddress
      tokenId
    }
  }
`;

export const fetchSubgraphData = async (): Promise<SubgraphData> => {
  try {
    const data = await request(SUBGRAPH_URL, MARKETPLACE_QUERY, {}, headers);
    return data as SubgraphData;
  } catch (error) {
    console.error('Error fetching subgraph data:', error);
    throw error;
  }
};

// 新增：获取特定用户的subgraph数据
export const fetchUserSubgraphData = async (userAddress: string): Promise<SubgraphData> => {
  try {
    const data = await request(SUBGRAPH_URL, USER_LISTINGS_QUERY, { seller: userAddress.toLowerCase() }, headers);
    return data as SubgraphData;
  } catch (error) {
    console.error('Error fetching user subgraph data:', error);
    throw error;
  }
};

// 计算可用的NFT列表 (itemListeds - itemCanceleds - itemBoughts)
export const getAvailableNFTs = (data: SubgraphData): ItemListed[] => {
  const { itemListeds, itemBoughts, itemCanceleds } = data;

  // 创建已购买和已取消的NFT集合，用于快速查找
  const boughtSet = new Set(
    itemBoughts.map(item => `${item.nftAddress.toLowerCase()}-${item.tokenId}`)
  );
  
  const canceledSet = new Set(
    itemCanceleds.map(item => `${item.nftAddress.toLowerCase()}-${item.tokenId}`)
  );

  // 过滤出仍然可用的NFT
  return itemListeds.filter(item => {
    const key = `${item.nftAddress.toLowerCase()}-${item.tokenId}`;
    return !boughtSet.has(key) && !canceledSet.has(key);
  });
};

// 新增：获取用户的有效上架NFT
export const getUserActiveListings = async (userAddress: string): Promise<ItemListed[]> => {
  try {
    const userData = await fetchUserSubgraphData(userAddress);
    return getAvailableNFTs(userData);
  } catch (error) {
    console.error('Error fetching user active listings:', error);
    return [];
  }
};

// 从TokenURI获取NFT元数据
export const fetchNFTMetadata = async (tokenUri: string) => {
  try {
    // 如果是IPFS URL，转换为HTTP URL
    let metadataUrl = tokenUri;
    if (tokenUri.startsWith('ipfs://')) {
      metadataUrl = tokenUri.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }

    const response = await fetch(metadataUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.status}`);
    }

    const metadata = await response.json();
    
    // 处理image URL
    let imageUrl = metadata.image;
    if (imageUrl && imageUrl.startsWith('ipfs://')) {
      imageUrl = imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }

    return {
      name: metadata.name,
      description: metadata.description,
      image: imageUrl,
      attributes: metadata.attributes || []
    };
  } catch (error) {
    console.error('Error fetching NFT metadata:', error);
    return null;
  }
};