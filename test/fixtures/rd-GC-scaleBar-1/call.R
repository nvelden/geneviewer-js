genes_data <- data.frame(
 start = c(1000, 9000, 13000, 17000, 21000),
 end = c(4000, 12000, 16000, 20000, 24000),
 name = c('Gene 1', 'Gene 3', 'Gene 4', 'Gene 5', 'Gene 6'),
 group = c('A', 'B', 'B', 'A', 'C'),
 cluster = c(1, 1, 2, 2, 2)
)
GC_chart(genes_data, cluster ="cluster", group = "group") %>%
GC_scaleBar(cluster = 1, title = "1 kb", scaleBarUnit = 1000) %>%
GC_scaleBar(cluster = 2, title = "2 kb", scaleBarUnit = 2000)
