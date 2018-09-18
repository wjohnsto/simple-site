import express from 'express';
import meta from '../middleware/meta';
import * as about from './about';
import * as blog from './blog';
import * as blogList from './bloglist';
import * as index from './home';

const router = express.Router();

router.get('/', index.context, meta, index.render);
router.get('/about', about.context, meta, about.render);

router.get('/blog', blogList.context, meta, blogList.render);
router.get('/blog/page/:page', blogList.context, meta, blogList.render);
router.get('/blog/:title', blog.context, meta, blog.render);
router.get('/blog/:title/amp', blog.context, meta, blog.render);

export = router;
