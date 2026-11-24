import { Header, Footer } from '../../components/Chrome';
import { WishlistArea } from '../../components/WishlistArea';
import { getProducts } from '../../data/source';

export const metadata = { title: 'Mes favoris - Mwinda Market', robots: { index: false, follow: false } };
export const revalidate = 10;

export default async function FavorisPage() {
  const products = await getProducts();
  return (<><Header active="" /><WishlistArea products={products} /><Footer /></>);
}
