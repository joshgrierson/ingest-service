import ShopifyService from "./shopify-service";
import { Services } from "share";

export default <Services> {
    shopify: new ShopifyService()
}