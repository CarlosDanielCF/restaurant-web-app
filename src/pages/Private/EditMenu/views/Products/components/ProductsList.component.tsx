import { useState, useEffect, FC, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';

// Material UI
import {
  Typography,
  Grid,
  FormControl,
  Box,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  ListSubheader,
  TextField,
  InputAdornment,
  IconButton
} from '@mui/material/';
import { SearchOutlined, ClearOutlined, FastfoodOutlined } from '@mui/icons-material';
import { EmptyState } from '@/components/ui';

import { IProduct } from '../../../../../../models';
import { ProductCard } from './ProductCard.component';

import { selectMenu, setActiveCategory } from '../../../../../../redux';

interface Props {}

export const ProductsList: FC<Props> = () => {
  const dispatch = useDispatch();

  const { activeCategory, products, sections, categories } =
    useSelector(selectMenu);

  const [filteredProducts, setFilteredProducts] =
    useState<IProduct[]>(products);
  const [searchQuery, setSearchQuery] = useState('');

  const changeCategory = (e: SelectChangeEvent) => {
    const categoryId = e.target.value;

    if (categoryId === '') {
      setFilteredProducts(products);
      dispatch(setActiveCategory(null));
      return;
    }

    const category = categories.find((s) => s.id === categoryId);
    if (!category) return;

    const filteredProducts = findProductsByCategory(categoryId);
    setFilteredProducts(filteredProducts);
    dispatch(setActiveCategory(category));
  };

  const findProductsByCategory = (categoryId: string) => {
    return products.filter((product) => product.category.id === categoryId);
  };

  const setProducts = () => {
    if (activeCategory) {
      const products = findProductsByCategory(activeCategory.id);
      setFilteredProducts(products);
    } else setFilteredProducts(products);
  };

  useEffect(() => {
    setProducts();
  }, [products]);

  useEffect(() => {
    setProducts();
  }, []);

  const displayedProducts = useMemo(() => {
    if (!searchQuery.trim()) return filteredProducts;
    return filteredProducts.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [filteredProducts, searchQuery]);

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
          mb: 3
        }}
      >
        <TextField
          size='small'
          placeholder='Buscar productos por nombre...'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ flex: 1, maxWidth: { xs: '100%', sm: 360 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <SearchOutlined fontSize='small' color='action' />
              </InputAdornment>
            ),
            endAdornment: searchQuery ? (
              <InputAdornment position='end'>
                <IconButton
                  size='small'
                  aria-label='Limpiar búsqueda'
                  onClick={() => setSearchQuery('')}
                >
                  <ClearOutlined fontSize='small' />
                </IconButton>
              </InputAdornment>
            ) : null
          }}
        />

        <FormControl sx={{ width: { xs: '100%', sm: 220 } }} size='small'>
          <InputLabel id='select-categoria'>Categoría</InputLabel>
          <Select
            id='grouped-select'
            label='Categoría'
            labelId='select-categoria'
            value={activeCategory?.id || ''}
            onChange={changeCategory}
          >
            <MenuItem value=''>
              <em>Todas las categorías</em>
            </MenuItem>
            {sections.map((section) => [
              <ListSubheader
                key={section.id}
                sx={{
                  fontWeight: 'bold'
                }}
              >
                {section.name}
              </ListSubheader>,

              ...section.categories.map((category) => (
                <MenuItem key={category.id} value={category.id} sx={{ pl: 3 }}>
                  {category.name}
                </MenuItem>
              ))
            ])}
          </Select>
        </FormControl>
      </Box>

      <Box mb={4}>
        {displayedProducts.length === 0 ? (
          <EmptyState
            icon={<FastfoodOutlined sx={{ fontSize: 44 }} />}
            title={
              searchQuery
                ? 'Sin coincidencias'
                : 'No se han registrado productos'
            }
            description={
              searchQuery
                ? `No encontramos productos que coincidan con "${searchQuery}". Intenta con otro término o limpia la búsqueda.`
                : 'Esta categoría aún no tiene productos registrados. Usa el botón "Añadir" para registrar el primero.'
            }
          />
        ) : (
          <Grid container spacing={2}>
            {displayedProducts.map((producto) => (
              <Grid key={producto.id!} item xs={12} sm={6} lg={4} xl={3}>
                <ProductCard producto={producto} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </>
  );
};
